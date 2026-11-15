import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { CreateOrderDto, PaymentType } from "./dto/create-order.dto";
import { HttpService } from "@nestjs/axios";
import { ErrorModel } from "@shared/error-model";
import {
  CheckoutStatusResponseDto,
  CreateOrderResponseDto,
  MyOrdersDto,
  RetryOrderResponseDto,
} from "./dto/responses.dto";
import { Checkout, Prisma, PrismaService, Partners } from "@libs/prisma-client";
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
import { MarketingDto } from "../dto/marketing.dto";

/** Мінімальна передоплата для замовлення з оплатою при отриманні, грн */
export const MIN_PREPAYMENT_UAH = 200;
const UAH_CURRENCY_CODE = 980;
const INVOICE_VALIDITY_SECONDS = 36000;
const INVOICE_CUSTOMER_EMAILS = ["ushkalo.herman@gmail.com"];
// Із цих статусів спроба може стати оплаченою (зокрема після повторного рахунку)
const PAYABLE_CHECKOUT_STATUSES = [
  "pending",
  "processing",
  "failure",
  "expired",
];
const RETRYABLE_CHECKOUT_STATUSES = ["pending", "failure", "expired"];

interface MonobankInvoiceStatus {
  invoiceId: string;
  status:
    | "created"
    | "processing"
    | "hold"
    | "success"
    | "failure"
    | "reversed"
    | "expired";
  amount: number;
  ccy: number;
  finalAmount?: number;
  reference?: string;
  failureReason?: string;
}

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

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

  // UTM метки не отдаём наружу — заказ можно получить по id без авторизации
  private readonly omitMarketingColumns = {
    utmSource: true,
    utmMedium: true,
    utmCampaign: true,
    utmTerm: true,
    utmContent: true,
  } as const;

  private mapMarketingToColumns(marketing?: MarketingDto): {
    utmSource: string | null;
    utmMedium: string | null;
    utmCampaign: string | null;
    utmTerm: string | null;
    utmContent: string | null;
  } {
    return {
      utmSource: marketing?.utm_source ?? null,
      utmMedium: marketing?.utm_medium ?? null,
      utmCampaign: marketing?.utm_campaign ?? null,
      utmTerm: marketing?.utm_term ?? null,
      utmContent: marketing?.utm_content ?? null,
    };
  }

  findAll(params: {
    take: number;
    skip: number;
    where: Prisma.OrderWhereInput;
  }): Promise<OrderDto[]> {
    return this.prisma.order.findMany({
      ...params,
      omit: this.omitMarketingColumns,
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

  private calculateTotal(
    items: { price: number; discount: number; quantity: number }[],
  ): number {
    return items.reduce(
      (acc, item) =>
        acc +
        Math.round(item.price - (item.price * item.discount) / 100) *
          item.quantity,
      0,
    );
  }

  // Повна оплата — сплачується вся сума; оплата при отриманні — обов'язкова
  // передоплата MIN_PREPAYMENT_UAH (або вся сума, якщо замовлення дешевше).
  private calculatePrepaidAmount(
    paymentType: PaymentType | string,
    totalAmount: number,
  ): number {
    if (paymentType === PaymentType.PREPAY) {
      return totalAmount;
    }
    return Math.min(MIN_PREPAYMENT_UAH, totalAmount);
  }

  /**
   * Оформлення замовлення. Замовлення в KeyCRM і в нашій базі тут НЕ
   * створюється: зберігаємо спробу оформлення (Checkout) і виставляємо
   * рахунок Monobank. Замовлення з'явиться лише після підтвердженої оплати
   * (див. orderCallback / syncCheckoutPayment).
   */
  async create(params: {
    data: CreateOrderDto;
    sessionId: string;
  }): Promise<CreateOrderResponseDto> {
    const { data, sessionId } = params;

    const totalAmount = this.calculateTotal(data.orderProducts);
    const prepaidAmount = this.calculatePrepaidAmount(
      data.paymentType,
      totalAmount,
    );
    if (prepaidAmount <= 0) {
      throw new BadRequestException(ErrorModel.INTERNAL_SERVER_ERROR);
    }

    try {
      // Перевіряємо товари і партнерів до виставлення рахунку,
      // щоб покупець не заплатив за замовлення, яке не можна створити.
      const productsWithPartners = await this.getProductsWithPartners(
        data.orderProducts,
      );
      this.groupProductsByPartner(productsWithPartners, data.orderProducts);

      const checkout = await this.prisma.checkout.create({
        data: {
          sessionId: sessionId || null,
          paymentType: data.paymentType,
          totalAmount,
          prepaidAmount,
          payload: JSON.parse(JSON.stringify(data)) as Prisma.InputJsonValue,
        },
      });

      const invoice = await this.createCheckoutInvoice(checkout);

      await this.prisma.checkout.update({
        where: { id: checkout.id },
        data: { invoiceId: invoice.invoiceId },
      });

      return {
        message: "Checkout created. Waiting for payment.",
        paymentPageUrl: invoice.pageUrl,
        checkoutId: checkout.id,
        prepaidAmount,
        totalAmount,
      };
    } catch (e) {
      this.logger.error(e);

      throw new InternalServerErrorException(ErrorModel.INTERNAL_SERVER_ERROR);
    }
  }

  private async createCheckoutInvoice(
    checkout: Checkout,
  ): Promise<{ invoiceId: string; pageUrl: string }> {
    const data = checkout.payload as unknown as CreateOrderDto;
    const isFullPrepay = checkout.paymentType === PaymentType.PREPAY;

    const basketOrder = isFullPrepay
      ? data.orderProducts.map((item) => {
          const priceWithDiscount =
            Math.round(item.price - (item.price * item.discount) / 100) * 100;
          return {
            name: `${item.name} (${item.size?.name || "base"})`,
            qty: item.quantity,
            sum: priceWithDiscount,
            total: priceWithDiscount * item.quantity,
            icon: item.image,
            unit: "шт.",
          };
        })
      : [
          {
            name: `Передоплата за замовлення на суму ${checkout.totalAmount} грн`,
            qty: 1,
            sum: checkout.prepaidAmount * 100,
            total: checkout.prepaidAmount * 100,
            unit: "шт.",
          },
        ];

    const bodyInvoice = {
      amount: checkout.prepaidAmount * 100,
      ccy: UAH_CURRENCY_CODE,
      merchantPaymInfo: {
        reference: checkout.id,
        destination: isFullPrepay
          ? "Lakotiy Store"
          : "Lakotiy Store — передоплата за замовлення",
        customerEmails: INVOICE_CUSTOMER_EMAILS,
        basketOrder,
      },
      redirectUrl: `${this.configService.get("CLIENT_URL")}/checkout/status?checkoutId=${checkout.id}`,
      webHookUrl: `${this.configService.get("BASE_URL")}/api/orders/callback`,
      validity: INVOICE_VALIDITY_SECONDS,
    };

    const response = await this.httpService.axiosRef.post<{
      invoiceId: string;
      pageUrl: string;
    }>("/merchant/invoice/create", bodyInvoice, {
      ...this.monobankRequestConfig(),
    });
    return response.data;
  }

  private monobankRequestConfig(): {
    baseURL: string;
    headers: Record<string, string>;
  } {
    return {
      baseURL: this.configService.get<string>("MONOBANK_API_URL"),
      headers: {
        "X-Token": this.configService.get<string>("MONOBANK_API_KEY"),
      },
    };
  }

  private async getMonobankInvoiceStatus(
    invoiceId: string,
  ): Promise<MonobankInvoiceStatus> {
    const response = await this.httpService.axiosRef.get<MonobankInvoiceStatus>(
      "/merchant/invoice/status",
      {
        params: { invoiceId },
        ...this.monobankRequestConfig(),
      },
    );
    return response.data;
  }

  private async removeMonobankInvoice(invoiceId: string): Promise<void> {
    try {
      await this.httpService.axiosRef.post(
        "/merchant/invoice/remove",
        { invoiceId },
        {
          ...this.monobankRequestConfig(),
        },
      );
    } catch (e) {
      // Рахунок міг уже протермінуватися — це не заважає виставити новий
      this.logger.warn(
        `Could not remove Monobank invoice ${invoiceId}: ${(e as Error).message}`,
      );
    }
  }

  /**
   * Звіряє стан оплати спроби оформлення з Monobank. Даним із тіла webhook
   * не довіряємо: статус і reference беремо із запиту до API Monobank
   * з нашим токеном, тож підроблений callback не створить замовлення.
   */
  async syncCheckoutPayment(
    checkout: Checkout,
    invoiceId?: string,
  ): Promise<Checkout> {
    const invoiceIdToCheck = invoiceId || checkout.invoiceId;
    if (!invoiceIdToCheck) {
      return checkout;
    }

    const invoice = await this.getMonobankInvoiceStatus(invoiceIdToCheck);
    if (invoice.reference !== checkout.id) {
      this.logger.warn(
        `Monobank invoice ${invoiceIdToCheck} reference ${invoice.reference} does not match checkout ${checkout.id}`,
      );
      return checkout;
    }

    switch (invoice.status) {
      case "success": {
        if (
          invoice.ccy !== UAH_CURRENCY_CODE ||
          invoice.amount < checkout.prepaidAmount * 100
        ) {
          this.logger.error(
            `Monobank invoice ${invoice.invoiceId} amount ${invoice.amount}/${invoice.ccy} does not cover checkout ${checkout.id} prepayment ${checkout.prepaidAmount}`,
          );
          break;
        }
        const claimed = await this.prisma.checkout.updateMany({
          where: {
            id: checkout.id,
            status: { in: PAYABLE_CHECKOUT_STATUSES },
          },
          data: {
            status: "paid",
            invoiceId: invoice.invoiceId,
            paidAt: new Date(),
            errorMessage: null,
          },
        });
        if (claimed.count) {
          await this.completeCheckout(checkout.id);
        } else if (
          checkout.invoiceId !== invoice.invoiceId &&
          checkout.status === "completed"
        ) {
          this.logger.error(
            `Checkout ${checkout.id} was paid twice (invoice ${invoice.invoiceId}), refund needed`,
          );
        }
        break;
      }
      case "processing":
      case "hold":
        await this.prisma.checkout.updateMany({
          where: { id: checkout.id, status: "pending" },
          data: { status: "processing" },
        });
        break;
      case "failure":
      case "expired":
      case "reversed":
        // Після повторної спроби старий рахунок не має перетирати статус нового
        await this.prisma.checkout.updateMany({
          where: {
            id: checkout.id,
            invoiceId: invoice.invoiceId,
            status: { in: ["pending", "processing"] },
          },
          data: {
            status: invoice.status === "expired" ? "expired" : "failure",
          },
        });
        break;
      default:
        break;
    }

    return this.prisma.checkout.findUniqueOrThrow({
      where: { id: checkout.id },
    });
  }

  /**
   * Створює замовлення в KeyCRM і в нашій базі для оплаченої спроби.
   * Безпечно викликати кілька разів: «захоплення» статусу paid → creating
   * гарантує, що створенням займається лише один процес.
   */
  async completeCheckout(checkoutId: string): Promise<void> {
    const claimed = await this.prisma.checkout.updateMany({
      where: { id: checkoutId, status: "paid" },
      data: { status: "creating" },
    });
    if (!claimed.count) {
      return;
    }

    const checkout = await this.prisma.checkout.findUniqueOrThrow({
      where: { id: checkoutId },
    });

    try {
      await this.createOrderFromCheckout(checkout);
    } catch (e) {
      const message =
        (e as { response?: { data?: unknown } })?.response?.data !== undefined
          ? JSON.stringify((e as { response: { data: unknown } }).response.data)
          : (e as Error).message;
      this.logger.error(
        `Failed to create order for paid checkout ${checkoutId}: ${message}`,
      );
      // Повернемо в paid — крон спробує ще раз
      await this.prisma.checkout.update({
        where: { id: checkoutId },
        data: { status: "paid", errorMessage: message?.slice(0, 1000) },
      });
    }
  }

  private async createOrderFromCheckout(checkout: Checkout): Promise<void> {
    const data = checkout.payload as unknown as CreateOrderDto;

    const productsWithPartners = await this.getProductsWithPartners(
      data.orderProducts,
    );
    const productsByPartner = this.groupProductsByPartner(
      productsWithPartners,
      data.orderProducts,
    );

    const crmOrderIds = await this.createOrdersInCrmByPartners(
      data,
      productsByPartner,
      checkout,
    );

    // Основне замовлення — перше (партнер першого товару), як і раніше
    const [mainCrmOrderId, ...additionalCrmOrderIds] = crmOrderIds;

    const newOrder = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          firstName: data.firstName,
          secondName: data.secondName,
          patronymic: data.patronymic,
          phoneNumber: data.phoneNumber,
          paymentType: data.paymentType,
          messengerType: data.messengerType,
          callCustomer: data.callCustomer,
          comment: data.comment,
          keyCrmOrderId: mainCrmOrderId,
          additionalKeyCrmIds: additionalCrmOrderIds.map(String),
          status: "created",
          paymentStatus: "success",
          invoiceId: checkout.invoiceId,
          prepaidAmount: checkout.prepaidAmount,
          city: data.city,
          warehouseAddress: data.warehouseAddress,
          warehouseNumber: data.warehouseNumber,
          warehouseType: data.warehouseType,
          ...this.mapMarketingToColumns(data.marketing),
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
      });
      await tx.checkout.update({
        where: { id: checkout.id },
        data: { status: "completed", orderId: order.id, errorMessage: null },
      });
      return order;
    });

    if (checkout.sessionId) {
      try {
        await this.basketService.clearBasket(checkout.sessionId);
        const session = await this.redis.get<string>(
          this.getKey(checkout.sessionId),
        );
        if (!session) {
          await this.redis.set<string>(
            this.getKey(checkout.sessionId),
            newOrder.phoneNumber,
            60 * 60 * 24,
          );
        }
      } catch (e) {
        this.logger.warn(
          `Could not update session ${checkout.sessionId}: ${(e as Error).message}`,
        );
      }
    }
  }

  async getCheckoutStatus(
    checkoutId: string,
  ): Promise<CheckoutStatusResponseDto | null> {
    let checkout = await this.prisma.checkout.findUnique({
      where: { id: checkoutId },
    });
    if (!checkout) {
      return null;
    }

    // Monobank перенаправляє покупця одразу після оплати, webhook може
    // прийти трохи пізніше — тому звіряємо статус і тут (не частіше ніж раз на 5 с).
    if (
      (checkout.status === "pending" || checkout.status === "processing") &&
      checkout.invoiceId
    ) {
      const throttleKey = `checkout-sync:${checkout.id}`;
      const recentlySynced = await this.redis.get<boolean>(throttleKey);
      if (!recentlySynced) {
        await this.redis.set<boolean>(throttleKey, true, 5);
        try {
          checkout = await this.syncCheckoutPayment(checkout);
        } catch (e) {
          this.logger.warn(
            `Could not sync checkout ${checkout.id}: ${(e as Error).message}`,
          );
        }
      }
    }

    const order = checkout.orderId
      ? await this.findOne({ where: { id: checkout.orderId } })
      : null;

    return {
      id: checkout.id,
      status: checkout.status as CheckoutStatusResponseDto["status"],
      paymentType: checkout.paymentType,
      totalAmount: checkout.totalAmount,
      prepaidAmount: checkout.prepaidAmount,
      orderId: checkout.orderId,
      order,
    };
  }

  async retryCheckoutPayment(
    checkoutId: string,
  ): Promise<RetryOrderResponseDto | null> {
    let checkout = await this.prisma.checkout.findUnique({
      where: { id: checkoutId },
    });
    if (!checkout) {
      return null;
    }

    if (checkout.status === "pending" && checkout.invoiceId) {
      checkout = await this.syncCheckoutPayment(checkout);
    }

    if (!RETRYABLE_CHECKOUT_STATUSES.includes(checkout.status)) {
      throw new BadRequestException(ErrorModel.INTERNAL_SERVER_ERROR);
    }

    // Старий неоплачений рахунок скасовуємо, щоб не було подвійної оплати
    if (checkout.status === "pending" && checkout.invoiceId) {
      await this.removeMonobankInvoice(checkout.invoiceId);
    }

    const invoice = await this.createCheckoutInvoice(checkout);
    await this.prisma.checkout.update({
      where: { id: checkout.id },
      data: { invoiceId: invoice.invoiceId, status: "pending" },
    });

    return {
      message: "Invoice has been created",
      paymentPageUrl: invoice.pageUrl,
    };
  }

  /** Для крону: дотворити замовлення для оплачених, але не створених спроб. */
  async retryPaidCheckouts(): Promise<void> {
    const staleCreatingBefore = new Date(Date.now() - 15 * 60 * 1000);
    // «creating», що висить довго — процес упав посеред створення
    await this.prisma.checkout.updateMany({
      where: { status: "creating", updatedAt: { lt: staleCreatingBefore } },
      data: { status: "paid" },
    });

    const paid = await this.prisma.checkout.findMany({
      where: { status: "paid" },
      take: 20,
      orderBy: { paidAt: "asc" },
    });
    for (const checkout of paid) {
      await this.completeCheckout(checkout.id);
    }
  }

  /** Для крону: звірити неоплачені спроби з Monobank, якщо webhook загубився. */
  async syncPendingCheckouts(): Promise<void> {
    const pending = await this.prisma.checkout.findMany({
      where: {
        status: { in: ["pending", "processing"] },
        invoiceId: { not: null },
        createdAt: {
          gt: new Date(Date.now() - (INVOICE_VALIDITY_SECONDS + 3600) * 1000),
        },
        updatedAt: { lt: new Date(Date.now() - 5 * 60 * 1000) },
      },
      take: 50,
      orderBy: { createdAt: "desc" },
    });
    for (const checkout of pending) {
      try {
        await this.syncCheckoutPayment(checkout);
      } catch (e) {
        this.logger.warn(
          `Could not sync checkout ${checkout.id}: ${(e as Error).message}`,
        );
      }
    }
  }

  // UTM метки — атрибуция момента создания заказа, обновлять их нельзя.
  // Prisma.OrderUpdateInput не содержит поля marketing, поэтому оно сюда не попадёт.
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
    // Нові замовлення (prepaidAmount != null) створюються вже оплаченими —
    // для них повторний рахунок не потрібен
    if (
      !order ||
      order.paymentStatus === "canceled" ||
      order.prepaidAmount !== null
    ) {
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
      omit: this.omitMarketingColumns,
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

  /**
   * Створює замовлення в CRM кожного партнера і повертає їхні id
   * (у порядку партнерів). Уже створені для цієї спроби замовлення
   * (checkout.crmOrderIds) не створюються вдруге.
   */
  private async createOrdersInCrmByPartners(
    orderData: CreateOrderDto,
    productsByPartner: Map<string, PartnerWithProducts>,
    checkout: Checkout,
  ): Promise<number[]> {
    const crmOrderIds: number[] = [];
    const createdCrmOrderIds: Record<string, number> = {
      ...((checkout.crmOrderIds as Record<string, number> | null) ?? {}),
    };
    const isMultiPartnerOrder = productsByPartner.size > 1;
    const orderType = isMultiPartnerOrder
      ? "Об'єднане замовлення"
      : "Єдине замовлення";

    // Сплачену онлайн суму розподіляємо по замовленнях партнерів по черзі
    let prepaidLeft = checkout.prepaidAmount;

    for (const [partnerId, { partner, products }] of productsByPartner) {
      const partnerTotal = this.calculateTotal(products);
      const prepaidForPartner = Math.min(prepaidLeft, partnerTotal);
      prepaidLeft -= prepaidForPartner;

      if (createdCrmOrderIds[partnerId]) {
        crmOrderIds.push(createdCrmOrderIds[partnerId]);
        continue;
      }

      const crmOrder = await this.createOrderInCrmForPartner(
        orderData,
        products,
        partner,
        orderType,
        {
          totalSum: partnerTotal,
          prepaidAmount: prepaidForPartner,
          invoiceId: checkout.invoiceId,
        },
      );
      crmOrderIds.push(crmOrder.id);
      createdCrmOrderIds[partnerId] = crmOrder.id;
      await this.prisma.checkout.update({
        where: { id: checkout.id },
        data: { crmOrderIds: createdCrmOrderIds },
      });
    }

    return crmOrderIds;
  }

  private buildCrmPayments(
    partner: Partners,
    payment: { totalSum: number; prepaidAmount: number; invoiceId: string },
  ) {
    const payments: CreateOrderCrmDto["payments"] = [];
    // Платежі створюються як not_paid: крон прив'язує до передоплати
    // транзакцію Monobank, і KeyCRM сам позначає її оплаченою.
    if (payment.prepaidAmount > 0) {
      payments.push({
        payment_method_id: partner.prePayId,
        payment_method: "Передоплата",
        amount: payment.prepaidAmount,
        description: `Сплачено онлайн через Monobank, рахунок ${payment.invoiceId}`,
        status: "not_paid",
      });
    }
    const restAmount = payment.totalSum - payment.prepaidAmount;
    if (restAmount > 0) {
      payments.push({
        payment_method_id: partner.postPayId,
        payment_method: "Оплата при отриманні",
        amount: restAmount,
        description: "",
        status: "not_paid",
      });
    }
    return payments;
  }

  private async createOrderInCrmForPartner(
    data: CreateOrderDto,
    products: OrderProductWithData[],
    partner: Partners,
    orderType: string,
    payment: { totalSum: number; prepaidAmount: number; invoiceId: string },
  ): Promise<CrmOrderResponse> {
    const typeMessenger = {
      TELEGRAM: "Телеграм",
      VIBER: "Viber",
      WHATSAPP: "WhatsApp",
      INSTAGRAM: "Instagram",
    };

    const restAmount = payment.totalSum - payment.prepaidAmount;

    const messageMessenger =
      data.messengerType !== "EMAIL"
        ? `${typeMessenger[data.messengerType]}: ${data.messenger}`
        : "";
    const messagePayment =
      data.paymentType === PaymentType.PREPAY
        ? `Тип оплати: Повна оплата онлайн (сплачено ${payment.prepaidAmount} грн)`
        : `Тип оплати: Передоплата ${payment.prepaidAmount} грн онлайн (сплачено), решта ${restAmount} грн — при отриманні`;
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
      payments: this.buildCrmPayments(partner, payment),
      marketing: data.marketing,
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
        description:
          "Якщо оплата не закріпилась, перевірити ФОП або написати @hushkalo в телеграм",
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
      ...this.monobankRequestConfig(),
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
    // Нові рахунки мають reference = id спроби оформлення (Checkout)
    const checkout = data?.reference
      ? await this.prisma.checkout.findUnique({
          where: { id: String(data.reference) },
        })
      : null;
    if (checkout) {
      try {
        await this.syncCheckoutPayment(checkout, data.invoiceId);
        return "OK";
      } catch (e) {
        this.logger.error(e);
        // 5xx — Monobank повторить webhook
        throw new InternalServerErrorException(
          ErrorModel.INTERNAL_SERVER_ERROR,
        );
      }
    }

    return this.legacyOrderCallback(data);
  }

  // Рахунки, виставлені до впровадження передоплати (reference = keyCrmOrderId)
  private async legacyOrderCallback(data: OrderCallbackCreateDto) {
    try {
      if (!/^\d+$/.test(String(data?.reference ?? ""))) {
        return "OK";
      }
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
    }>(
      `payments/external-transactions?filter[created_between]=${from},${to}&limit=50`,
      {
        baseURL: apiUrl,
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );
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
