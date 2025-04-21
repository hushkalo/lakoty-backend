import { Injectable } from "@nestjs/common";
import { Prisma, Product, PrismaService } from "@libs/prisma-client";
import { type ResponseDataType } from "@shared/types";

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.ProductWhereInput;
    orderBy?: Prisma.ProductOrderByWithRelationInput[];
    include?: Prisma.ProductInclude;
    omit?: Prisma.ProductOmit;
  }): Promise<ResponseDataType<Product[]>> {
    const { omit, include, take, skip, orderBy, ...restParams } = params;
    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        ...params,
        take,
        skip,
        orderBy,
        include,
        omit,
      }),
      this.prisma.product.count(restParams),
    ]);
    return {
      data: products,
      total,
      to: products.length,
    };
  }

  async getRecommendedProducts(params: {
    where: Prisma.ProductWhereInput;
    take: number;
    include?: Prisma.ProductInclude;
    omit?: Prisma.ProductOmit;
    orderBy?: Prisma.ProductOrderByWithRelationInput;
  }): Promise<Product[]> {
    const countProductCategory = await this.prisma.product.count({
      where: params.where,
    });
    return this.prisma.product.findMany({
      ...params,
      skip:
        countProductCategory < 7
          ? 0
          : Math.floor(Math.random() * countProductCategory),
    });
  }

  findOne(params: {
    where: Prisma.ProductWhereUniqueInput;
    omit?: Prisma.ProductOmit;
    include?: Prisma.ProductInclude;
  }): Promise<Product> {
    return this.prisma.product.findUnique(params);
  }
}
