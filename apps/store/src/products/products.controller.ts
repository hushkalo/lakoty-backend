import { Controller, Get, Param, Query } from "@nestjs/common";
import { ProductsService } from "./products.service";
import { Product as ProductModel } from "@libs/prisma-client";
import { ResponseDataType } from "@shared/types";

@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(
    @Query("take") take?: number,
    @Query("skip") skip?: number,
    @Query("searchString") searchString?: string,
    @Query("orderBy") orderBy?: "asc" | "desc",
    @Query("categoryId") categoryId?: string,
    @Query("alias") alias?: string,
    @Query("categoryAlias") categoryAlias?: string,
  ): Promise<ResponseDataType<ProductModel[]>> {
    return this.productsService.findAll({
      take: Number(take) || undefined,
      skip: Number(skip) || undefined,
      where: {
        name: {
          contains: searchString,
          mode: "insensitive",
        },
        categoryId: categoryId ? categoryId : undefined,
        alias: alias ? alias : undefined,
        category: {
          alias: categoryAlias,
        },
      },
      orderBy: [
        {
          topProduct: "desc",
        },
        {
          name: orderBy ? orderBy : undefined,
        },
      ],
      include: {
        images: {
          select: {
            url: true,
          },
        },
      },
      omit: {
        categoryId: true,
        updatedAt: true,
        createdAt: true,
      },
    });
  }

  @Get(":id")
  findOne(@Param("id") id: string): Promise<ProductModel> {
    return this.productsService.findOne({
      where: { id },
      include: {
        images: true,
        productSizes: true,
      },
    });
  }

  @Get("alias/:alias")
  async findAlias(
    @Param("alias") alias: string,
  ): Promise<ProductModel & { recommendations: ProductModel[] }> {
    const product = await this.productsService.findOne({
      where: { alias },
      include: {
        images: {
          select: {
            url: true,
          },
        },
        productSizes: {
          omit: {
            productId: true,
            createdAt: true,
            updatedAt: true,
            keyCrmId: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      omit: {
        createdAt: true,
        updatedAt: true,
      },
    });
    const recommendations = await this.productsService.getRecommendedProducts({
      where: {
        category: {
          id: product.categoryId,
        },
      },
      orderBy: {
        topProduct: "desc",
      },
      take: 7,
      include: {
        images: {
          select: {
            url: true,
          },
        },
      },
      omit: {
        categoryId: true,
        createdAt: true,
        updatedAt: true,
        keyCrmId: true,
        quantity: true,
      },
    });
    return {
      ...product,
      recommendations,
    };
  }
}
