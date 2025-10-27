import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { CreateOrderDto } from "./dto/create-order.dto";
import { HttpService } from "@nestjs/axios";
import { ErrorModel } from "@shared/error-model";
import {
  CreateOrderResponseDto,
  MyOrdersDto,
  RetryOrderResponseDto,
} from "./dto/responses.dto";
import { Prisma, PrismaService, Partners } from "@libs/prisma-client";
import { EnvironmentVariablesForStore } from "@shared/configuration";
import { ConfigService } from "@nestjs/config";
import { OrderCallbackCreateDto } from "./dto/order.callback.dto";
import { OrderDto, OrderProductDto } from "./dto/order.dto";
import { CreateOrderCrmDto } from "./dto/create.order.crm.dto";
import { AxiosResponse } from "axios";
import { BasketService } from "../basket/basket.service";
import { OrderStatusDto } from "./dto/order-status.dto";
import { CallbackRequestBodyDto } from "./dto/callback.dto";
import { StatusEnum } from "./enum/status.enum";
import { RedisService } from "../redis/redis.service";
import {
  ProductWithPartner,
  OrderProductWithData,
  PartnerWithProducts,
  CrmOrderResponse,
  CrmOrderDetails,
} from "./dto/partner-types.dto";

@Injectable()
export class OrderService {
  constructor(
    private readonly httpService: HttpService,
    private prisma: PrismaService,
    private readonly configService: ConfigService<EnvironmentVariablesForStore>,
    private readonly basketService: BasketService,
    private readonly redis: RedisService,
  ) {}

  private getKey(sessionId: string) {
    return `orders:${sessionId}`;
  }

  findAll(params: {
    take: number;
    skip: number;
    where: Prisma.OrderWhereInput;
  }): Promise<OrderDto[]> {
    return this.prisma.order.findMany({
      ...params,
      include: {
        OrderProduct: {
          include: {
            Product: { include: { images: true } },
            ProductSize: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  count(params?: { where: Prisma.OrderWhereInput }): Promise<number> {
    return this.prisma.order.count(params);
  }

  async create(params: {
    data: CreateOrderDto;
    sessionId: string;
  }): Promise<CreateOrderResponseDto> {
    if (params.sessionId) {
      await this.basketService.clearBasket(params.sessionId);
    }

    const { data } = params;
    try {
      // Получаем информацию о продуктах с партнерами
      const productsWithPartners = await this.getProductsWithPartners(
        data.orderProducts,
      );

      // Группируем продукты по партнерам
      const productsByPartner = this.groupProductsByPartner(
        productsWithPartners,
        data.orderProducts,
      );

      // Создаем заказы в CRM для каждого партнера
      const crmOrders = await this.createOrdersInCrmByPartners(
        data,
        productsByPartner,
      );

      // Выбираем основной заказ (первый) для сохранения в нашей базе
      const mainCrmOrder = crmOrders[0];

      // Получаем все остальные ID заказов CRM для additionalKeyCrmIds
      const additionalCrmOrderIds = crmOrders
        .slice(1)
        .map((order) => order.id.toString());

      const newOrder = await this.prisma.order.create({
        data: {
          firstName: data.firstName,
          secondName: data.secondName,
          patronymic: data.patronymic,
          phoneNumber: data.phoneNumber,
          paymentType: data.paymentType,
          messengerType: data.messengerType,
          callCustomer: data.callCustomer,
          comment: data.comment,
          keyCrmOrderId: mainCrmOrder.id,
          additionalKeyCrmIds: additionalCrmOrderIds,
          status: "created",
          city: data.city,
          warehouseAddress: data.warehouseAddress,
          warehouseNumber: data.warehouseNumber,
          warehouseType: data.warehouseType,
          OrderProduct: {
            createMany: {
              data: data.orderProducts.map((item) => ({
                discount: item.discount,
                price: item.price,
                productId: item.productId,
                quantity: item.quantity,
                sizeId: item.size?.id,
              })),
            },
          },
        },
        include: {
          OrderProduct: {
            include: {
              Product: {
                select: {
                  name: true,
                  alias: true,
                  images: true,
                  partnersId: true,
                },
              },
              ProductSize: true,
            },
          },
        },
      });
      const invoice = undefined;
      // data.paymentType === "PREPAY"
      //   ? await this.createInvoice({
      //       data: newOrder.OrderProduct,
      //       orderId: newOrder.id,
      //       crmOrderId: mainCrmOrder.id.toString(),
      //     })
      //   : undefined;

      await this.update(newOrder.id, {
        invoiceId: invoice?.invoiceId,
      });

      if (params.sessionId) {
        const session = await this.redis.get<string>(
          this.getKey(params.sessionId),
        );

        if (!session) {
          await this.redis.set<string>(
            this.getKey(params.sessionId),
            newOrder.phoneNumber,
            60 * 60 * 24,
          );
        }
      }

      return {
        message: "Order created successfully.",
        paymentPageUrl: invoice?.pageUrl,
        orderId: newOrder.id,
      };
    } catch (e) {
      console.error(e);

      throw new InternalServerErrorException(ErrorModel.INTERNAL_SERVER_ERROR);
    }
  }

  update(
    orderId: string,
    data: Prisma.OrderUpdateInput,
  ): Promise<Omit<OrderDto, "OrderProduct">> {
    return this.prisma.order.update({ where: { id: orderId }, data });
  }

  async retryPayment(orderId: string): Promise<RetryOrderResponseDto> {
    const order = await this.findOne({
      where: {
        id: orderId,
      },
    });
    if (!order || order.paymentStatus === "canceled") {
      return null;
    }

    // Получаем партнера для заказа
    const partner = await this.getPartnerFromCrmOrder(
      order.keyCrmOrderId.toString(),
    );

    const totalSum = order.OrderProduct.reduce(
      (acc, item) =>
        acc +
        Math.round(item.price - (item.price * item.discount) / 100) *
          item.quantity,
      0,
    );
    const orderFromCrm = await this.getOrderFromCrm(
      order.keyCrmOrderId,
      partner,
    );
    const notPaidPayment = orderFromCrm.payments.find((item) => {
      return item.status !== "canceled" && item.amount === totalSum;
    });
    if (!notPaidPayment) {
      await this.createCrmOrderPayment(
        order.keyCrmOrderId.toString(),
        totalSum,
        "not_paid",
        partner,
      );
    }
    const newInvoice = await this.createInvoice({
      data: order.OrderProduct,
      orderId: order.id,
      crmOrderId: order.keyCrmOrderId.toString(),
    });
    await this.update(order.id, {
      invoiceId: newInvoice.invoiceId,
      paymentStatus: "retry",
    });
    return {
      message: "Invoice has been created",
      paymentPageUrl: newInvoice.pageUrl,
    };
  }

  async findOne(params: {
    where: Prisma.OrderWhereUniqueInput;
  }): Promise<OrderDto | null> {
    const order = await this.prisma.order.findUnique({
      ...params,
      include: {
        OrderProduct: {
          include: {
            Product: {
              select: {
                name: true,
                alias: true,
                images: true,
                partnersId: true,
                Partner: true,
              },
            },
            ProductSize: true,
          },
        },
      },
    });
    if (!order) {
      return null;
    }
    return order;
  }

  private async getProductsWithPartners(
    orderProducts: CreateOrderDto["orderProducts"],
  ): Promise<ProductWithPartner[]> {
    const productIds = orderProducts.map((item) => item.productId);

    return this.prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      include: {
        Partner: true,
      },
    });
  }

  private groupProductsByPartner(
    productsWithPartners: ProductWithPartner[],
    orderProducts: CreateOrderDto["orderProducts"],
  ): Map<string, PartnerWithProducts> {
    const productsByPartner = new Map<string, PartnerWithProducts>();

    orderProducts.forEach((orderProduct) => {
      const productWithPartner = productsWithPartners.find(
        (p) => p.id === orderProduct.productId,
      );

      if (!productWithPartner || !productWithPartner.Partner) {
        throw new Error(
          `Product ${orderProduct.productId} has no partner assigned`,
        );
      }

      const partnerId = productWithPartner.Partner.id;

      if (!productsByPartner.has(partnerId)) {
        productsByPartner.set(partnerId, {
          partner: productWithPartner.Partner,
          products: [],
        });
      }

      const partnerGroup = productsByPartner.get(partnerId);
      if (partnerGroup) {
        partnerGroup.products.push({
          ...orderProduct,
          productData: productWithPartner,
        });
      }
    });

    return productsByPartner;
  }

  private async createOrdersInCrmByPartners(
    orderData: CreateOrderDto,
    productsByPartner: Map<string, PartnerWithProducts>,
  ): Promise<CrmOrderResponse[]> {
    const crmOrders: CrmOrderResponse[] = [];
    const isMultiPartnerOrder = productsByPartner.size > 1;
    const orderType = isMultiPartnerOrder
      ? "Об'єднане замовлення"
      : "Єдине замовлення";

    for (const [, { partner, products }] of productsByPartner) {
      const crmOrder = await this.createOrderInCrmForPartner(
        orderData,
        products,
        partner,
        orderType,
      );
      crmOrders.push(crmOrder);
    }

    return crmOrders;
  }

  private async createOrderInCrmForPartner(
    data: CreateOrderDto,
    products: OrderProductWithData[],
    partner: Partners,
    orderType: string,
  ): Promise<CrmOrderResponse> {
    const typeMessenger = {
      TELEGRAM: "Телеграм",
      VIBER: "Viber",
      WHATSAPP: "WhatsApp",
      INSTAGRAM: "Instagram",
    };

    const totalSum = products.reduce(
      (acc, item) =>
        acc +
        Math.round(item.price - (item.price * item.discount) / 100) *
          item.quantity,
      0,
    );

    const messageMessenger =
      data.messengerType !== "EMAIL"
        ? `${typeMessenger[data.messengerType]}: ${data.messenger}`
        : "";
    const messagePayment =
      data.paymentType === "PREPAY"
        ? "Тип отплати: Передоплата"
        : "Тип отплати: Оплата при отриманні";
    const messageCall = data.callCustomer
      ? "Телефонувати клієнту"
      : "Не телефонувати клієнту";
    const userComment = data.comment ? `Коментар клієнта: ${data.comment}` : "";
    const orderTypeMessage = `Тип заказу: ${orderType}`;

    const bodyOrder = {
      source_id: partner.sourceId,
      manager_id: partner.managerId,
      buyer_comment: [
        messageMessenger,
        messagePayment,
        messageCall,
        userComment,
        orderTypeMessage,
      ]
        .filter(Boolean)
        .join("\n"),
      buyer: {
        full_name: `${data.firstName} ${data.secondName} ${data.patronymic}`,
        phone: data.phoneNumber,
        email: data.messengerType === "EMAIL" ? data.messenger : null,
      },
      shipping: {
        delivery_service_id: partner.deliveryServiceId,
        shipping_service: "Нова Пошта",
        shipping_address_city: data.city,
        shipping_address_country: "Ukraine",
        shipping_address_region: data.cityArea,
        shipping_receive_point: `${data.warehouseType} ${data.warehouseNumber}`,
        recipient_full_name: `${data.firstName} ${data.secondName} ${data.patronymic}`,
        recipient_phone: data.phoneNumber,
        warehouse_ref: data.warehouseRef,
      },
      products: products.map((item) => ({
        sku: item?.size?.sku ? item.size.sku : item.sku,
        price: item.price,
        discount_percent: item.discount,
        quantity: item.quantity,
        unit_type: "од.",
        name: item.name,
        picture: item.image,
        properties: [
          {
            name: "Розмір",
            value: item?.size?.name || "Базовий",
          },
        ],
      })),
      payments: [
        {
          payment_method_id:
            data.paymentType === "PREPAY"
              ? partner.prePayId
              : partner.postPayId,
          payment_method:
            data.paymentType === "PREPAY"
              ? "Передоплата"
              : "Оплата при отриманні",
          amount: totalSum,
          description: "",
          status: "not_paid",
        },
      ],
    };

    const response = await this.httpService.axiosRef.post<
      unknown,
      AxiosResponse<{
        id: number;
      }>,
      CreateOrderCrmDto
    >("/order", bodyOrder, {
      baseURL: partner.apiUrl,
      headers: {
        Authorization: `Bearer ${partner.apiKey}`,
      },
    });

    return response.data;
  }

  private async createCrmOrderPayment(
    crmOrderId: string,
    amount: number,
    status: "not_paid" | "paid",
    partner?: Partners,
  ): Promise<void> {
    // Если партнер не передан, получаем его из заказа
    if (!partner) {
      partner = await this.getPartnerFromCrmOrder(crmOrderId);
    }

    await this.httpService.axiosRef.post(
      `/order/${crmOrderId}/payment`,
      {
        payment_method_id: partner.prePayId,
        payment_method: "Передоплата",
        amount,
        description: "",
        status,
      },
      {
        baseURL: partner.apiUrl,
        headers: {
          Authorization: `Bearer ${partner.apiKey}`,
        },
      },
    );
    return;
  }

  private async createInvoice(params: {
    data: OrderProductDto[];
    orderId: string;
    crmOrderId: string;
  }) {
    const { data, crmOrderId, orderId } = params;
    const totalSum = data.reduce(
      (acc, item) =>
        acc +
        Math.round(item.price - (item.price * item.discount) / 100) *
          item.quantity,
      0,
    );
    const bodyInvoice = {
      amount: totalSum * 100,
      ccy: 980,
      merchantPaymInfo: {
        reference: crmOrderId,
        destination: "Lakotiy Store",
        customerEmails: ["ushkalo.herman@gmail.com"],
        basketOrder: data.map((item) => {
          const priceWithDiscount =
            Math.round(item.price - (item.price * item.discount) / 100) * 100;
          return {
            name: `${item.Product.name} (${item.ProductSize?.name || "base"})`,
            qty: item.quantity,
            sum: priceWithDiscount,
            total: priceWithDiscount * item.quantity,
            icon: item.Product.images[0].url,
            unit: "шт.",
          };
        }),
      },
      redirectUrl: `${this.configService.get("CLIENT_URL")}/checkout/status?&orderId=${orderId}`,
      webHookUrl: `${this.configService.get("BASE_URL")}/api/orders/callback`,
      validity: 36000,
    };
    const response = await this.httpService.axiosRef.post<{
      invoiceId: string;
      pageUrl: string;
    }>("/merchant/invoice/create", bodyInvoice, {
      baseURL: this.configService.get("MONOBANK_API_URL"),
      headers: {
        "X-Token": this.configService.get("MONOBANK_API_KEY"),
      },
    });
    return response.data;
  }

  private async getPartnerFromCrmOrder(crmOrderId: string): Promise<Partners> {
    const order = await this.prisma.order.findUnique({
      where: { keyCrmOrderId: Number(crmOrderId) },
      include: {
        OrderProduct: {
          include: {
            Product: {
              include: {
                Partner: true,
              },
            },
          },
        },
      },
    });

    if (!order || !order.OrderProduct[0]?.Product?.Partner) {
      throw new Error(`Partner not found for CRM order ${crmOrderId}`);
    }

    return order.OrderProduct[0].Product.Partner;
  }

  async getOrderFromCrm(
    crmOrderId: number,
    partner?: Partners,
  ): Promise<CrmOrderDetails> {
    // Если партнер не передан, получаем его
    if (!partner) {
      partner = await this.getPartnerFromCrmOrder(crmOrderId.toString());
    }

    const orderFromCrm = await this.httpService.axiosRef.get<CrmOrderDetails>(
      `order/${crmOrderId}?include=payments`,
      {
        baseURL: partner.apiUrl,
        headers: {
          Authorization: `Bearer ${partner.apiKey}`,
        },
      },
    );
    return orderFromCrm.data;
  }

  async orderCallback(data: OrderCallbackCreateDto) {
    try {
      console.log("Order callback data:", data);
      const order = await this.prisma.order.findUnique({
        where: {
          keyCrmOrderId: Number(data.reference),
        },
      });
      if (
        data.status === "created" ||
        !order ||
        order.paymentStatus === "failure" ||
        order.paymentStatus === "success" ||
        order.paymentStatus === "completed"
      )
        return "OK";

      if (data.status === "processing") {
        return this.prisma.order.update({
          where: {
            id: order.id,
          },
          data: {
            paymentStatus: "processing",
          },
        });
      }
      // Получаем партнера для заказа
      const partner = await this.getPartnerFromCrmOrder(
        order.keyCrmOrderId.toString(),
      );

      const orderFromCrm = await this.getOrderFromCrm(
        order.keyCrmOrderId,
        partner,
      );
      const notPaidPayment = orderFromCrm.payments.find(
        (item) =>
          item.status !== "canceled" && item.amount === data.amount / 100,
      );
      if (data.status === "success") {
        if (!notPaidPayment) {
          await this.createCrmOrderPayment(
            orderFromCrm.id.toString(),
            data.amount / 100,
            "not_paid",
            partner,
          );
        }
        return this.prisma.order.update({
          where: {
            id: order.id,
          },
          data: {
            paymentStatus: "success",
          },
        });
      }
      if (data.status === "failure") {
        await this.httpService.axiosRef.put(
          `order/${order.keyCrmOrderId}/payment/${notPaidPayment.id}`,
          {
            status: "canceled",
          },
          {
            baseURL: partner.apiUrl,
            headers: {
              Authorization: `Bearer ${partner.apiKey}`,
            },
          },
        );
        return this.prisma.order.update({
          where: {
            id: order.id,
          },
          data: {
            paymentStatus: "failure",
          },
        });
      }
      return order;
    } catch (e) {
      console.error(e);
      throw new InternalServerErrorException(ErrorModel.INTERNAL_SERVER_ERROR);
    }
  }

  async getExternalPayment(params: {
    from: string;
    to: string;
    partner?: Partners;
  }) {
    const { from, to, partner } = params;

    // Если партнер не передан, используем конфигурацию по умолчанию (для совместимости)
    const apiUrl = partner?.apiUrl || this.configService.get("CRM_API_URL");
    const apiKey = partner?.apiKey || this.configService.get("CRM_API_KEY");

    const externalPayment = await this.httpService.axiosRef.get<{
      data: {
        id: number;
        uuid: number;
        source_uuid: string;
        amount: number;
        description: string;
        currency: string;
      }[];
    }>(`payments/external-transactions?filter[created_between]=${from},${to}`, {
      baseURL: apiUrl,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    return externalPayment.data.data;
  }

  async setExternalPaymentToOrder(
    paymentId: number,
    data: {
      transaction_id: number;
      transaction_uuid: number;
    },
    partner?: Partners,
  ) {
    // Если партнер не передан, используем конфигурацию по умолчанию (для совместимости)
    const apiUrl = partner?.apiUrl || this.configService.get("CRM_API_URL");
    const apiKey = partner?.apiKey || this.configService.get("CRM_API_KEY");

    await this.httpService.axiosRef.post<
      unknown,
      unknown,
      {
        transaction_id: number;
        transaction_uuid: number;
      }
    >(`/payments/${paymentId}/external-transactions`, data, {
      baseURL: apiUrl,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    return "OK";
  }

  async changeStatusOrder(data: CallbackRequestBodyDto) {
    const { context } = data;

    // Получаем партнера для заказа
    const partner = await this.getPartnerFromCrmOrder(context.id.toString());

    const statusOrder = await this.httpService.axiosRef.get<{
      data: OrderStatusDto[];
    }>(`/order/status`, {
      baseURL: partner.apiUrl,
      headers: {
        Authorization: `Bearer ${partner.apiKey}`,
      },
    });

    const findStatus = statusOrder.data.data.find(
      (item) => item.id === context.status_id,
    );

    if (!findStatus) {
      console.log(`Order status not found: ${context.status_id}`);
      return "OK";
    }

    if (findStatus.id === StatusEnum.READY_TO_DELIVERY) {
      await this.prisma.order.update({
        where: {
          keyCrmOrderId: context.id,
        },
        data: {
          status: "ready_to_delivery",
        },
      });
      return "OK";
    }

    if (findStatus.id === StatusEnum.ON_ROAD) {
      await this.prisma.order.update({
        where: {
          keyCrmOrderId: context.id,
        },
        data: {
          status: "on_road",
        },
      });
      return "OK";
    }

    if (findStatus.id === StatusEnum.ARRIVED) {
      await this.prisma.order.update({
        where: {
          keyCrmOrderId: context.id,
        },
        data: {
          status: "arrived",
        },
      });
      return "OK";
    }

    if (findStatus.id === StatusEnum.DONE) {
      await this.prisma.order.update({
        where: {
          keyCrmOrderId: context.id,
        },
        data: {
          status: "done",
          paymentStatus: "completed",
        },
      });
      return "OK";
    }

    if (findStatus.id === StatusEnum.CANCELED) {
      await this.prisma.order.update({
        where: {
          keyCrmOrderId: context.id,
        },
        data: {
          status: "canceled",
          paymentStatus: "canceled",
        },
      });
      return "OK";
    }

    return "OK";
  }

  async getMyOrders(params: {
    sessionId: string;
    phoneNumber?: string;
    take: number;
    skip: number;
  }): Promise<MyOrdersDto> {
    const { sessionId, take, skip, phoneNumber } = params;
    const timeExpired = 60 * 60 * 24;
    const userSession = await this.redis.get<string>(this.getKey(sessionId));
    const userSessionData = await this.redis.get<MyOrdersDto>(
      `${this.getKey(sessionId)}?take=${take}&skip=${skip}`,
    );

    if (userSessionData) {
      return userSessionData;
    }

    if (!userSession && !phoneNumber) {
      return {
        countArrived: 0,
        countOnRoad: 0,
        orders: [],
        total: 0,
        to: 0,
      };
    }

    if (!userSession && phoneNumber) {
      const orders = await this.findAll({
        take,
        skip,
        where: {
          phoneNumber,
        },
      });

      const total = await this.count();

      const countArrived = await this.count({
        where: {
          status: "arrived",
        },
      });

      const countOnRoad = await this.count({
        where: {
          status: "on_road",
        },
      });

      const result = {
        countArrived,
        countOnRoad,
        orders,
        total,
        to: orders.length,
      };
      if (total !== 0) {
        await this.redis.set<string>(
          this.getKey(sessionId),
          phoneNumber,
          timeExpired,
        );
        await this.redis.set<MyOrdersDto>(
          `${this.getKey(sessionId)}?take=${take}&skip=${skip}`,
          result,
          60,
        );
      }

      return result;
    }

    const orders = await this.findAll({
      take,
      skip,
      where: {
        phoneNumber: userSession,
      },
    });

    const total = await this.count();

    const countArrived = await this.count({
      where: {
        status: "arrived",
      },
    });

    const countOnRoad = await this.count({
      where: {
        status: "on_road",
      },
    });

    const result = {
      countArrived,
      countOnRoad,
      orders,
      total,
      to: orders.length,
    };

    await this.redis.set<MyOrdersDto>(
      `${this.getKey(sessionId)}?take=${take}&skip=${skip}`,
      result,
      60,
    );

    return result;
  }
}
