import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ProductsService } from "./products.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { Product as ProductModel } from "@prisma/client";
import { ResponseDataType } from "../type/response-data.type";

@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() data: CreateProductDto): Promise<ProductModel> {
    return this.productsService.create(data);
  }

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
      orderBy: {
        name: orderBy ? orderBy : undefined,
        topProduct: "desc",
      },
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
            id: true,
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

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() data: UpdateProductDto,
  ): Promise<ProductModel> {
    return this.productsService.update({
      where: {
        id,
      },
      data,
    });
  }

  @Delete(":id")
  remove(@Param("id") id: string): Promise<ProductModel> {
    return this.productsService.remove({
      id,
    });
  }
}
