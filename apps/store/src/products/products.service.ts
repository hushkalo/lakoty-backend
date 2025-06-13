import { Injectable } from "@nestjs/common";
import { Prisma, PrismaService } from "@libs/prisma-client";
import { ProductDto, RecommendationProductDto } from "./dto/product.dto";
import {
  ProductSizesResponseDto,
  ProductsResponseDto,
} from "./dto/responses.dto";
import { CategoriesService } from "../categories/categories.service";

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categoryService: CategoriesService,
  ) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.ProductWhereInput;
    orderBy?: Prisma.ProductOrderByWithRelationInput[];
  }): Promise<ProductsResponseDto> {
    const products = await this.prisma.product.findMany({
      ...params,
      include: {
        images: {
          select: {
            url: true,
          },
        },
        productSizes: {
          select: {
            id: true,
            name: true,
            sku: true,
            quantity: true,
            isAvailable: true,
          },
        },
        category: true,
      },
      omit: {
        updatedAt: true,
        createdAt: true,
      },
    });
    const total = await this.countProducts({
      where: params.where,
    });

    return {
      data: products,
      total,
      to: products.length,
    };
  }

  countProducts(params?: {
    where?: Prisma.ProductWhereInput;
  }): Promise<number> {
    return this.prisma.product.count(params);
  }

  async getRecommendedProducts(params: {
    where: Prisma.ProductWhereInput;
  }): Promise<RecommendationProductDto[]> {
    const countProductWithSameCategory = await this.countProducts(params);
    return this.prisma.product.findMany({
      ...params,
      orderBy: {
        top: "desc",
      },
      take: 7,
      skip:
        countProductWithSameCategory < 7
          ? 0
          : Math.floor(Math.random() * countProductWithSameCategory),
      include: {
        images: {
          select: {
            url: true,
          },
        },
        category: true,
      },
      omit: {
        categoryId: true,
        createdAt: true,
        updatedAt: true,
        keyCrmId: true,
        quantity: true,
      },
    });
  }

  async findOne(params: {
    where: Prisma.ProductWhereUniqueInput;
  }): Promise<ProductDto> {
    const product = await this.prisma.product.findUnique({
      ...params,
      include: {
        images: {
          select: {
            url: true,
          },
        },
        productSizes: {
          select: {
            id: true,
            name: true,
            sku: true,
            quantity: true,
            isAvailable: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        category: true,
      },
      omit: {
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!product) {
      return null;
    }
    return product;
  }

  async getSizeByCategoryAlias(
    categoryId?: string,
  ): Promise<ProductSizesResponseDto> {
    if (!categoryId) {
      const sizes = await this.prisma.productSize.findMany({
        where: {
          isAvailable: true,
        },
        select: {
          name: true,
        },
        distinct: ["name"],
        orderBy: {
          name: "asc",
        },
      });
      return {
        data: sizes.map((size) => size.name),
      };
    }
    const categoryIds =
      await this.categoryService.getAllSubCategoryIds(categoryId);

    if (!categoryIds) {
      return {
        data: [],
      };
    }

    const sizes = await this.prisma.productSize.findMany({
      where: {
        isAvailable: true,
        Product: {
          categoryId: {
            in: categoryIds,
          },
        },
      },
      select: {
        name: true,
      },
      distinct: ["name"],
      orderBy: {
        name: "asc",
      },
    });
    return { data: sizes.map((size) => size.name) };
  }
}
