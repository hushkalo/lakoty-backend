import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { CreateOrderDto } from "./dto/create-order.dto";
import { HttpService } from "@nestjs/axios";
import { ErrorModel } from "@shared/error-model";
import { CreateOrderResponseDto } from "./dto/responses.dto";
import { Prisma, PrismaService } from "@libs/prisma-client";
import { EnvironmentVariablesForStore } from "@shared/configuration";
import { ConfigService } from "@nestjs/config";
import { OrderCallbackCreateDto } from "./dto/order.callback.dto";

@Injectable()
export class OrderService {
  constructor(
    private readonly httpService: HttpService,
    private prisma: PrismaService,
    private readonly configService: ConfigService<EnvironmentVariablesForStore>,
  ) {}

  async create(data: Prisma.OrderCreateInput) {
    return this.prisma.order.create({ data });
  }

  async createOrderInCrm(params: {
    data: CreateOrderDto;
  }): Promise<CreateOrderResponseDto> {
    const { data } = params;
    const totalSum = data.orderProducts.reduce(
      (acc, item) =>
        acc +
        Math.round(item.price - (item.price * item.discount) / 100) *
          item.quantity,
      0,
    );
    const typeMessenger = {
      TELEGRAM: "Телеграм",
      VIBER: "Viber",
      WHATSAPP: "WhatsApp",
      INSTAGRAM: "Instagram",
    };
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
        unit_type: "шт.",
        name: item.name,
        picture: item.image,
        properties: [
          {
            name: "Розмір",
            value: item.size.name,
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
    try {
      const responseCreateOrder = await this.httpService.axiosRef.post<{
        id: number;
      }>("/order", bodyOrder, {
        baseURL: this.configService.get("CRM_API_URL"),
        headers: {
          Authorization: `Bearer ${this.configService.get("CRM_API_KEY")}`,
        },
      });
      const bodyInvoice = {
        amount: totalSum * 100,
        ccy: 980,
        merchantPaymInfo: {
          reference: responseCreateOrder.data.id.toString(),
          destination: "Lakotiy Store",
          customerEmails: ["ushkalo.herman@gmail.com"],
          basketOrder: data.orderProducts.map((item) => {
            const priceWithDiscount =
              Math.round(item.price - (item.price * item.discount) / 100) * 100;
            return {
              name: item.name,
              qty: item.quantity,
              sum: priceWithDiscount,
              total: priceWithDiscount * item.quantity,
              icon: item.image,
              unit: "шт.",
            };
          }),
        },
        redirectUrl: `${this.configService.get("CLIENT_URL")}/checkout?status=success&orderId=${responseCreateOrder.data.id}`,
        webHookUrl: `${this.configService.get("BASE_URL")}/callback`,
        validity: 36000,
      };
      const responseCreateInvoice =
        data.paymentType === "PREPAY"
          ? await this.httpService.axiosRef.post<{
              invoiceId: string;
              pageUrl: string;
            }>("/merchant/invoice/create", bodyInvoice, {
              baseURL: this.configService.get("MONOBANK_API_URL"),
              headers: {
                "X-Token": this.configService.get("MONOBANK_API_KEY"),
              },
            })
          : undefined;
      await this.create({
        firstName: data.firstName,
        secondName: data.secondName,
        patronymic: data.patronymic,
        phoneNumber: data.phoneNumber,
        paymentType: data.paymentType,
        messengerType: data.messengerType,
        callCustomer: data.callCustomer,
        comment: data.comment,
        keyCrmOrderId: responseCreateOrder.data.id,
        invoiceId: responseCreateInvoice.data.invoiceId,
        status: "created",
      });
      return {
        message: "Order created successfully.",
        paymentPageUrl: responseCreateInvoice.data.pageUrl,
      };
    } catch (e) {
      console.error(e);
      throw new InternalServerErrorException(ErrorModel.INTERNAL_SERVER_ERROR);
    }
  }

  async orderCallback(data: OrderCallbackCreateDto) {
    const order = await this.prisma.order.findUnique({
      where: {
        keyCrmOrderId: Number(data.reference),
      },
    });
    if (data.status === "created" || !order) return;
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
    if (data.status === "success") {
      const orderFromCrm = await this.httpService.axiosRef.get<{
        payments: {
          id: number;
        }[];
      }>(`order/${order.keyCrmOrderId}?include=payments`, {
        baseURL: this.configService.get("CRM_API_URL"),
        headers: {
          Authorization: `Bearer ${this.configService.get("CRM_API_KEY")}`,
        },
      });
      await this.httpService.axiosRef.put(
        `order/${order.keyCrmOrderId}/payment/${orderFromCrm.data.payments[0].id}`,
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
      const orderFromCrm = await this.httpService.axiosRef.get<{
        payments: {
          id: number;
        }[];
      }>(`order/${order.keyCrmOrderId}?include=payments`, {
        baseURL: this.configService.get("CRM_API_URL"),
        headers: {
          Authorization: `Bearer ${this.configService.get("CRM_API_KEY")}`,
        },
      });
      await this.httpService.axiosRef.put(
        `order/${order.keyCrmOrderId}/payment/${orderFromCrm.data.payments[0].id}`,
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
  }
}
