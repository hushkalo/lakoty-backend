import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { CreateOrderDto } from "./dto/create-order.dto";
import { Prisma, PrismaService } from "@libs/prisma-client";
import { ErrorModel } from "@shared/error-model";
import { OrdersResponseDto } from "./dto/response.dto";
import { OrderDto } from "./dto/order.dto";
import { UpdateOrderDto } from "./dto/update-order.dto";
import { CreateOrderCrmDto } from "./dto/create.order.crm";
import { HttpService } from "@nestjs/axios";

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
    private readonly httpService: HttpService,
  ) {}
  SERVICE_NAME = "OrderService";
  create(params: { data: CreateOrderDto }) {
    const {
      data: { orderProducts, ...rest },
    } = params;
    try {
      return this.prisma.order.create({
        data: {
          ...rest,
          Status: {
            connect: {
              id: 1,
            },
          },
          OrderProduct: {
            createMany: {
              data: orderProducts.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
                discount: item.discount,
                sizeId: item.size.name === "base" ? undefined : item.size.id,
              })),
            },
          },
        },
      });
    } catch (error) {
      this.logger.error("Error creating order", error, this.SERVICE_NAME);
      throw new InternalServerErrorException(ErrorModel.INTERNAL_SERVER_ERROR);
    }
  }
  async confirm(params: { id: string }) {
    const order = await this.findOne({
      where: { id: params.id },
    });
    if (order.statusId !== 1) {
      throw new BadRequestException(ErrorModel.ORDER_ALREADY_CONFIRMED);
    }
    await this.createOrderInCrm({
      source_id: 20,
      manager_id: 16,
      buyer_comment: order.comment,
      buyer: {
        full_name: `${order.firstName} ${order.secondName} ${order.patronymic}`,
        phone: order.phoneNumber,
        email: order.messengerType === "email" ? order.messenger : null,
      },
      shipping: {
        delivery_service_id: 3,
        shipping_service: "Нова Пошта",
        shipping_address_city: order.city,
        shipping_address_country: "Ukraine",
        shipping_address_region: order.cityArea,
        shipping_receive_point: `${order.warehouseType} ${order.warehouseNumber}`,
        recipient_full_name: `${order.firstName} ${order.secondName} ${order.patronymic}`,
        recipient_phone: order.phoneNumber,
        warehouse_ref: order.warehouseRef,
      },
      products: order.OrderProduct.map((item) => ({
        sku: item.Product.sku,
        price: item.price,
        discount_percent: item.discount,
        discount_amount: Math.round((item.price * item.discount) / 100),
        quantity: item.quantity,
        unit_type: "шт.",
        name: item.Product.name,
        picture: item.Product.images[0]?.url || "",
        properties: [
          {
            name: "Розмір",
            value: item.ProductSize ? item.ProductSize.name : "base",
          },
        ],
      })),
    });
    this.prisma.$transaction(async (prisma) => {
      return prisma.order.update({
        where: { id: params.id },
        data: {
          Status: {
            connect: {
              id: 3,
            },
          },
        },
      });
    });
  }

  private createOrderInCrm(data: CreateOrderCrmDto) {
    return this.httpService.axiosRef.post("/order", data);
  }

  async cancel(params: { id: string }) {
    const order = await this.findOne({
      where: { id: params.id },
    });
    if (order.statusId !== 1) {
      throw new BadRequestException(ErrorModel.ORDER_ALREADY_CONFIRMED);
    }
    return this.prisma.order.update({
      where: { id: params.id },
      data: {
        Status: {
          connect: {
            id: 4,
          },
        },
      },
    });
  }

  async update(params: {
    data: UpdateOrderDto;
    where: Prisma.OrderWhereUniqueInput;
  }): Promise<OrderDto> {
    const { data, where } = params;
    if (!data) {
      throw new BadRequestException(ErrorModel.ORDER_BODY_UPDATE_ERROR);
    }
    const { orderProducts, ...rest } = data;
    const order = await this.findOne({
      where,
    });
    try {
      return await this.prisma.order.update({
        where,
        data: {
          ...rest,
          OrderProduct: orderProducts && {
            updateMany:
              orderProducts &&
              order.OrderProduct.map((item) => {
                const updatedItem = orderProducts.find(
                  (op) => op.orderProductId === item.id,
                );
                if (updatedItem) {
                  return {
                    where: { id: item.id },
                    data: {
                      quantity: updatedItem.quantity,
                      price: updatedItem.price,
                      discount: updatedItem.discount,
                      sizeId:
                        updatedItem.size.name === "base"
                          ? undefined
                          : updatedItem.size.id,
                    },
                  };
                }
                return null;
              }).filter(Boolean),
            deleteMany:
              orderProducts?.length > 0
                ? {
                    id: {
                      notIn: orderProducts
                        .map((item) => item.orderProductId)
                        .filter((id) => id !== undefined && id !== null),
                    },
                  }
                : undefined,
            createMany: {
              data:
                orderProducts &&
                orderProducts
                  .filter((item) => !item.orderProductId)
                  .map((item) => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price,
                    discount: item.discount,
                    sizeId:
                      item.size.name === "base" ? undefined : item.size.id,
                  })),
            },
          },
        },
        include: {
          Status: true,
          OrderProduct: {
            include: {
              Product: {
                include: {
                  images: true,
                },
              },
              ProductSize: true,
            },
          },
          _count: true,
        },
      });
    } catch (error) {
      console.log(error);
      this.logger.error("Error updating order", error, this.SERVICE_NAME);
      throw new InternalServerErrorException(ErrorModel.INTERNAL_SERVER_ERROR);
    }
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.OrderWhereInput;
    orderBy?: Prisma.OrderOrderByWithRelationInput;
  }): Promise<OrdersResponseDto> {
    const [orders, count] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        ...params,
        include: {
          Status: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: true,
        },
      }),
      this.prisma.order.count({
        where: params?.where,
      }),
    ]);
    return {
      data: orders,
      total: count,
      to: orders.length,
    };
  }

  async findOne(params: {
    where: Prisma.OrderWhereUniqueInput;
  }): Promise<OrderDto> {
    const order = await this.prisma.order.findUnique({
      where: params.where,
      include: {
        Status: true,
        OrderProduct: {
          include: {
            Product: {
              include: {
                images: true,
              },
            },
            ProductSize: true,
          },
        },
        _count: true,
      },
    });
    if (!order) {
      throw new BadRequestException({
        error_code: ErrorModel.ORDER_NOT_FOUND.error_code,
        message: ErrorModel.ORDER_NOT_FOUND.message + ` ID: ${params.where.id}`,
      });
    }
    return order;
  }
}
