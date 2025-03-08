import { Injectable } from "@nestjs/common";
import { CreateOrderDto } from "./dto/create-order.dto";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma, Order } from "@prisma/client";
import { ResponseDataType } from "../type/response-data.type";

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  create(params: { data: Prisma.OrderCreateInput & CreateOrderDto }) {
    const {
      data: { products, ...rest },
    } = params;
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
            data: products.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              discount: item.discount,
              sizeId: item.size.productSizeId,
            })),
          },
        },
      },
    });
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.OrderWhereInput;
    orderBy?: Prisma.OrderOrderByWithRelationInput;
    omit?: Prisma.OrderOmit;
    include?: Prisma.OrderInclude;
  }): Promise<ResponseDataType<Order[]>> {
    const { omit, include, ...restParams } = params;
    const [orders, count] = await this.prisma.$transaction([
      this.prisma.order.findMany({ ...restParams, include, omit }),
      this.prisma.order.count(restParams),
    ]);
    return {
      data: orders,
      total: count,
      to: orders.length,
    };
  }

  findOne(params: {
    where: Prisma.OrderWhereUniqueInput;
    include?: Prisma.OrderInclude;
    omit?: Prisma.OrderOmit;
  }) {
    return this.prisma.order.findUnique(params);
  }
}
