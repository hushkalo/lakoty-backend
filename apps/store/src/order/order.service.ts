import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { CreateOrderDto } from "./dto/create-order.dto";
import { HttpService } from "@nestjs/axios";
import { ErrorModel } from "@shared/error-model";
import { CreateOrderResponseDto } from "./dto/responses.dto";

@Injectable()
export class OrderService {
  constructor(private readonly httpService: HttpService) {}

  // async create(params: { data: CreateOrderDto }) {
  //   const { orderProducts, ...rest } = params.data;
  //   const { productIds, sizeIds } = orderProducts.reduce(
  //     (
  //       acc: {
  //         productIds: string[];
  //         sizeIds: string[];
  //       },
  //       item,
  //     ) => {
  //       const productId = item.productId;
  //       const productSizeId = item.size.id;
  //       return {
  //         productIds: [...acc.productIds, productId],
  //         sizeIds: [...acc.sizeIds, productSizeId],
  //       };
  //     },
  //     {
  //       productIds: [],
  //       sizeIds: [],
  //     },
  //   );
  //   const findAllProduct = await this.productsService.findAll({
  //     where: {
  //       id: {
  //         in: productIds,
  //       },
  //     },
  //   });
  //   if (findAllProduct.total !== productIds.length) {
  //     const notFoundProduct = productIds.filter(
  //       (item) => !findAllProduct.data.some((product) => product.id === item),
  //     );
  //     throw new BadRequestException(
  //       ErrorModel.PRODUCT_DOES_NOT_EXIST + notFoundProduct.join(", "),
  //     );
  //   }
  //   const findAllProductSize = await this.productsService.findAll({
  //     where: {
  //       productSizes: {
  //         some: {
  //           id: {
  //             in: sizeIds,
  //           },
  //         },
  //       },
  //     },
  //   });
  //   if (findAllProductSize.total !== sizeIds.length) {
  //     const notFoundProductSize = sizeIds.filter(
  //       (item) =>
  //         !findAllProductSize.data.some((product) =>
  //           product.productSizes.some((size) => size.id === item),
  //         ),
  //     );
  //     throw new BadRequestException(
  //       ErrorModel.PRODUCT_SIZE_NOT_FOUND + notFoundProductSize.join(", "),
  //     );
  //   }
  //   return this.prisma.order.create({
  //     data: {
  //       ...rest,
  //       Status: {
  //         connect: {
  //           id: 1,
  //         },
  //       },
  //       OrderProduct: {
  //         createMany: {
  //           data: orderProducts.map((item) => ({
  //             productId: item.productId,
  //             quantity: item.quantity,
  //             price: item.price,
  //             discount: item.discount,
  //             sizeId: item.size.name === "base" ? undefined : item.size.id,
  //           })),
  //         },
  //       },
  //     },
  //   });
  // }

  async createOrderInCrm(params: {
    data: CreateOrderDto;
  }): Promise<CreateOrderResponseDto> {
    const typeMessenger = {
      TELEGRAM: "Телеграм",
      VIBER: "Viber",
      WHATSAPP: "WhatsApp",
      INSTAGRAM: "Instagram",
    };
    const { data } = params;
    const body = {
      source_id: 20,
      manager_id: 16,
      buyer_comment: `${data.comment || ""}\n${data.messengerType !== "EMAIL" ? `${typeMessenger[data.messengerType]}: ${data.messenger}` : ""}\n Тип отплати: ${data.paymentType === "PREPAY" ? "Передоплата" : "Оплата при отриманні"}`,
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
    };
    try {
      await this.httpService.axiosRef.post("/order", body);
      return { message: "Order created successfully." };
    } catch (e) {
      console.error("Error creating order in CRM:", e);
      throw new InternalServerErrorException(ErrorModel.INTERNAL_SERVER_ERROR);
    }
  }
}
