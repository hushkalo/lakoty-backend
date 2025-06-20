import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { CreateOrderDto } from "./dto/create-order.dto";
import { HttpService } from "@nestjs/axios";
import { ErrorModel } from "@shared/error-model";
import {
  CreateOrderResponseDto,
  RetryOrderResponseDto,
} from "./dto/responses.dto";
import { Prisma, PrismaService } from "@libs/prisma-client";
import { EnvironmentVariablesForStore } from "@shared/configuration";
import { ConfigService } from "@nestjs/config";
import { OrderCallbackCreateDto } from "./dto/order.callback.dto";
import { OrderDto, OrderProductDto } from "./dto/order.dto";
import { CreateOrderCrmDto } from "./dto/create.order.crm.dto";
import { AxiosResponse } from "axios";

@Injectable()
export class OrderService {
  constructor(
    private readonly httpService: HttpService,
    private prisma: PrismaService,
    private readonly configService: ConfigService<EnvironmentVariablesForStore>,
  ) {}

  async create(params: {
    data: CreateOrderDto;
  }): Promise<CreateOrderResponseDto> {
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
      const invoice =
        data.paymentType === "PREPAY"
          ? await this.createInvoice({
              data: newOrder.OrderProduct,
              orderId: newOrder.id,
              crmOrderId: orderFromCrm.id.toString(),
            })
          : undefined;
      await this.update(newOrder.id, {
        invoiceId: invoice?.invoiceId,
      });
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
    if (!order) {
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
      console.log(item.amount, totalSum);
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
      status: "retry",
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
      manager_id: 16,
      buyer_comment: [
        userComment,
        messageMessenger,
        messagePayment,
        messageCall,
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
        sku: item.sku,
        price: item.price,
        discount_percent: item.discount,
        discount_amount: Math.round((item.price * item.discount) / 100),
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
          payment_method_id: 27,
          payment_method:
            data.paymentType === "PREPAY"
              ? "Передоплата"
              : "Оплата при отриманні",
          amount: data.paymentType === "PREPAY" ? totalSum : 200,
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
        payment_method_id: 27,
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

  private async getOrderFromCrm(crmOrderId: number) {
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
        order.status === "failure" ||
        order.status === "success"
      )
        return;

      if (data.status === "processing") {
        return this.prisma.order.update({
          where: {
            id: order.id,
          },
          data: {
            status: "processing",
          },
        });
      }
      const orderFromCrm = await this.getOrderFromCrm(order.keyCrmOrderId);
      const notPaidPayment = orderFromCrm.payments.find(
        (item) =>
          item.status !== "canceled" && item.amount === data.amount / 100,
      );
      if (data.status === "success") {
        if (notPaidPayment) {
          await this.httpService.axiosRef.put(
            `order/${order.keyCrmOrderId}/payment/${notPaidPayment.id}`,
            {
              status: "paid",
            },
            {
              baseURL: this.configService.get("CRM_API_URL"),
              headers: {
                Authorization: `Bearer ${this.configService.get("CRM_API_KEY")}`,
              },
            },
          );
        } else {
          await this.createCrmOrderPayment(
            orderFromCrm.id.toString(),
            data.amount / 100,
            "paid",
          );
        }
        return this.prisma.order.update({
          where: {
            id: order.id,
          },
          data: {
            status: "success",
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
            status: "failure",
          },
        });
      }
      return order;
    } catch (e) {
      console.error(e);
      throw new InternalServerErrorException(ErrorModel.INTERNAL_SERVER_ERROR);
    }
  }
}
