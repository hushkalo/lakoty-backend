import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { CreateOrderDto } from "./dto/create-order.dto";
import { HttpService } from "@nestjs/axios";
import { ErrorModel } from "@shared/error-model";
import {
  CreateOrderResponseDto,
  MyOrdersDto,
  RetryOrderResponseDto,
} from "./dto/responses.dto";
import { Prisma, PrismaService } from "@libs/prisma-client";
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
      const orderFromCrm = await this.createOrderInCrm(data);
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
          keyCrmOrderId: orderFromCrm.id,
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
      //       crmOrderId: orderFromCrm.id.toString(),
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
    const totalSum = order.OrderProduct.reduce(
      (acc, item) =>
        acc +
        Math.round(item.price - (item.price * item.discount) / 100) *
          item.quantity,
      0,
    );
    const orderFromCrm = await this.getOrderFromCrm(order.keyCrmOrderId);
    const notPaidPayment = orderFromCrm.payments.find((item) => {
      return item.status !== "canceled" && item.amount === totalSum;
    });
    if (!notPaidPayment) {
      await this.createCrmOrderPayment(
        order.keyCrmOrderId.toString(),
        totalSum,
        "not_paid",
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

  private async createOrderInCrm(data: CreateOrderDto) {
    const typeMessenger = {
      TELEGRAM: "Телеграм",
      VIBER: "Viber",
      WHATSAPP: "WhatsApp",
      INSTAGRAM: "Instagram",
    };
    const totalSum = data.orderProducts.reduce(
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
    const bodyOrder = {
      source_id: 20,
      manager_id: Number(this.configService.get("MANAGER_ID")),
      buyer_comment: [
        messageMessenger,
        messagePayment,
        messageCall,
        userComment,
      ]
        .filter(Boolean)
        .join("\n"),
      buyer: {
        full_name: `${data.firstName} ${data.secondName} ${data.patronymic}`,
        phone: data.phoneNumber,
        email: data.messengerType === "EMAIL" ? data.messenger : null,
      },
      shipping: {
        delivery_service_id: 3,
        shipping_service: "Нова Пошта",
        shipping_address_city: data.city,
        shipping_address_country: "Ukraine",
        shipping_address_region: data.cityArea,
        shipping_receive_point: `${data.warehouseType} ${data.warehouseNumber}`,
        recipient_full_name: `${data.firstName} ${data.secondName} ${data.patronymic}`,
        recipient_phone: data.phoneNumber,
        warehouse_ref: data.warehouseRef,
      },
      products: data.orderProducts.map((item) => ({
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
              ? this.configService.get("POSTPAY_ID")
              : this.configService.get("POSTPAY_ID"),
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
      baseURL: this.configService.get("CRM_API_URL"),
      headers: {
        Authorization: `Bearer ${this.configService.get("CRM_API_KEY")}`,
      },
    });
    return response.data;
  }

  private async createCrmOrderPayment(
    crmOrderId: string,
    amount: number,
    status: "not_paid" | "paid",
  ): Promise<void> {
    await this.httpService.axiosRef.post(
      `/order/${crmOrderId}/payment`,
      {
        payment_method_id: this.configService.get("PREPAY_ID"),
        payment_method: "Передоплата",
        amount,
        description: "",
        status,
      },
      {
        baseURL: this.configService.get("CRM_API_URL"),
        headers: {
          Authorization: `Bearer ${this.configService.get("CRM_API_KEY")}`,
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

  async getOrderFromCrm(crmOrderId: number) {
    const orderFromCrm = await this.httpService.axiosRef.get<{
      id: number;
      payments: {
        id: number;
        status: string;
        amount: number;
      }[];
    }>(`order/${crmOrderId}?include=payments`, {
      baseURL: this.configService.get("CRM_API_URL"),
      headers: {
        Authorization: `Bearer ${this.configService.get("CRM_API_KEY")}`,
      },
    });
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
      const orderFromCrm = await this.getOrderFromCrm(order.keyCrmOrderId);
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
            baseURL: this.configService.get("CRM_API_URL"),
            headers: {
              Authorization: `Bearer ${this.configService.get("CRM_API_KEY")}`,
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

  async getExternalPayment(params: { from: string; to: string }) {
    const { from, to } = params;
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
      baseURL: this.configService.get("CRM_API_URL"),
      headers: {
        Authorization: `Bearer ${this.configService.get("CRM_API_KEY")}`,
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
  ) {
    await this.httpService.axiosRef.post<
      unknown,
      unknown,
      {
        transaction_id: number;
        transaction_uuid: number;
      }
    >(`/payments/${paymentId}/external-transactions`, data, {
      baseURL: this.configService.get("CRM_API_URL"),
      headers: {
        Authorization: `Bearer ${this.configService.get("CRM_API_KEY")}`,
      },
    });
    return "OK";
  }

  async changeStatusOrder(data: CallbackRequestBodyDto) {
    const { context } = data;
    const statusOrder = await this.httpService.axiosRef.get<{
      data: OrderStatusDto[];
    }>(`/order/status`, {
      baseURL: this.configService.get("CRM_API_URL"),
      headers: {
        Authorization: `Bearer ${this.configService.get("CRM_API_KEY")}`,
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
