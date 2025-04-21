import { BadRequestException, Injectable } from "@nestjs/common";
import { CreateOrderDto } from "./dto/create-order.dto";
import { Prisma, Order, PrismaService } from "@libs/prisma-client";
import { ResponseDataType } from "@shared/types";
import { ErrorModel } from "@shared/error-model";

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
              sizeId:
                item.size.name === "base" ? undefined : item.size.productSizeId,
            })),
          },
        },
      },
    });
  }
  async confirm(params: { id: string }) {
    const order = await this.findOne({
      where: { id: params.id },
      include: {
        Status: true,
      },
    });
    if (order.statusId !== 1) {
      throw new BadRequestException(ErrorModel.ORDER_ALREADY_CONFIRMED);
    }
    return this.prisma.order.update({
      where: { id: params.id },
      data: {
        Status: {
          connect: {
            id: 3,
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

  findOne<T extends Prisma.OrderInclude>(params: {
    where: Prisma.OrderWhereUniqueInput;
    include: T;
  }): Promise<Prisma.OrderGetPayload<{ include: T }> | null> {
    return this.prisma.order.findUnique({
      where: params.where,
      include: params.include,
    });
  }
}
