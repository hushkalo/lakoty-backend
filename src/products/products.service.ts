import { Injectable, NotFoundException } from "@nestjs/common";
import { UpdateProductDto } from "./dto/update-product.dto";
import { Prisma, Product } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { ResponseDataType } from "../type/response-data.type";
import { CategoriesService } from "../categories/categories.service";

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly category: CategoriesService,
  ) {}

  async create(data: CreateProductDto): Promise<Product> {
    const { categoryId, images, productSizes, ...productData } = data;
    const isCategoryExist = await this.category.isExist({ id: categoryId });
    if (!isCategoryExist) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }
    return this.prisma.product.create({
      data: {
        ...productData,
        category: {
          connect: { id: categoryId },
        },
        images: {
          create: images.map((image) => ({
            url: image.url,
          })),
        },
        productSizes: {
          create: productSizes,
        },
      },
    });
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.ProductWhereInput;
    orderBy?: Prisma.ProductOrderByWithRelationInput;
    include?: Prisma.ProductInclude;
    omit?: Prisma.ProductOmit;
  }): Promise<ResponseDataType<Product[]>> {
    const { omit, include, take, skip, ...restParams } = params;
    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        ...params,
        take,
        skip,
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

  async update(params: {
    where: Prisma.ProductWhereUniqueInput;
    data: UpdateProductDto;
  }): Promise<Product> {
    const { where, data } = params;
    const { categoryId, images, productSizes, ...productData } = data;
    const isCategoryExist = await this.category.isExist({ id: categoryId });
    if (!isCategoryExist) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }
    // const existingSizes = await this.prisma.productSize.findMany({
    //   where: { productId: where.id },
    // });
    return this.prisma.product.update({
      data: {
        ...productData,
        category: {
          connect: { id: categoryId },
        },
        images: {
          deleteMany: {
            productId: where.id,
            id: {
              notIn: images.map((image) => image.id).filter((size) => size),
            },
          },
          upsert: images.map((image) => ({
            where: { id: image.id || "" },
            update: { url: image.url },
            create: {
              url: image.url,
            },
          })),
        },
        productSizes: {
          deleteMany: {
            productId: where.id,
            id: {
              notIn: productSizes.map((size) => size.id).filter((size) => size),
            },
          },
          upsert: productSizes.map((size) => ({
            where: {
              id: size.id || "",
            },
            update: size,
            create: size,
          })),
        },
      },
      where,
      include: {
        images: true,
        productSizes: true,
      },
    });
  }

  async remove(where: Prisma.ProductWhereUniqueInput): Promise<Product> {
    const product = await this.prisma.product.findUnique({
      where,
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${where.id} not found`);
    }
    await this.prisma.productImage.deleteMany({
      where: { productId: where.id },
    });
    await this.prisma.productSize.deleteMany({
      where: { productId: where.id },
    });
    return this.prisma.product.delete({
      where,
    });
  }
}
