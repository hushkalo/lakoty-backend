import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ProductsService } from "./products.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { Product as ProductModel } from "@prisma/client";
import { ResponseDataType } from "../type/response-data.type";
import { JwtGuard } from "../guards/jwt.guard";

@Controller("admin/products")
export class AdminProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @UseGuards(JwtGuard)
  @Post()
  create(@Body() data: CreateProductDto): Promise<ProductModel> {
    return this.productsService.create(data);
  }

  @UseGuards(JwtGuard)
  @Get()
  findAll(
    @Query("take") take?: number,
    @Query("skip") skip?: number,
    @Query("searchString") searchString?: string,
    @Query("orderBy") orderBy?: "asc" | "desc",
    @Query("categoryId") categoryId?: string,
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
        category: {
          alias: categoryAlias || undefined,
        },
      },
      orderBy: {
        name: orderBy ? orderBy : undefined,
        topProduct: "desc",
      },
      include: {
        images: true,
        productSizes: true,
        category: true,
      },
    });
  }

  @UseGuards(JwtGuard)
  @Get(":id")
  findOne(@Param("id") id: string): Promise<ProductModel> {
    return this.productsService.findOne({
      where: { id },
      include: {
        images: true,
        productSizes: true,
        category: true,
      },
    });
  }

  @UseGuards(JwtGuard)
  @Get("alias/:alias")
  async findAlias(@Param("alias") alias: string): Promise<ProductModel> {
    return this.productsService.findOne({
      where: { alias },
      include: {
        images: true,
        productSizes: {
          orderBy: {
            createdAt: "asc",
          },
        },
        category: true,
      },
    });
  }

  @UseGuards(JwtGuard)
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

  @UseGuards(JwtGuard)
  @Delete(":id")
  remove(@Param("id") id: string): Promise<ProductModel> {
    return this.productsService.remove({
      id,
    });
  }
}
