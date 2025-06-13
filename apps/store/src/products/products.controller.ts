import { Controller, Get, Param, Query } from "@nestjs/common";
import { ProductsService } from "./products.service";
import {
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import {
  ProductSizesResponseDto,
  ProductsResponseDto,
  ProductWithRecommendationResponseDto,
} from "./dto/responses.dto";
import { ProductDto } from "./dto/product.dto";
import { AppError, ErrorModel } from "@shared/error-model";

@ApiTags("Products")
@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: "Get all products with filtering and pagination" })
  @ApiQuery({
    name: "take",
    required: false,
    type: Number,
    description: "Number of items to take",
  })
  @ApiQuery({
    name: "skip",
    required: false,
    type: Number,
    description: "Number of items to skip",
  })
  @ApiQuery({
    name: "searchString",
    required: false,
    type: String,
    description: "Search products by name",
  })
  @ApiQuery({
    name: "orderBy",
    required: false,
    enum: ["asc", "desc"],
    description: "Order by name",
  })
  @ApiQuery({
    name: "categoryId",
    required: false,
    type: String,
    description: "Filter by category ID",
  })
  @ApiQuery({
    name: "parentCategoryId",
    required: false,
    type: String,
    description: "Filter by parent category ID",
  })
  @ApiQuery({
    name: "alias",
    required: false,
    type: String,
    description: "Filter by product alias",
  })
  @ApiQuery({
    name: "sortBy",
    required: false,
    enum: ["chipper", "expensive", "popular", "discount"],
    description: "Sort by price or popularity",
  })
  @ApiQuery({
    name: "categoryAlias",
    required: false,
    type: String,
    description: "Filter by category alias",
  })
  @ApiQuery({
    name: "sale",
    required: false,
    type: Boolean,
    description: "Filter products on sale",
  })
  @ApiQuery({
    name: "novelty",
    required: false,
    type: Boolean,
    description: "Filter products by novelty",
  })
  @ApiQuery({
    name: "filter[size_name]",
    required: false,
    type: String,
    description: "Filter products by size name",
  })
  @ApiQuery({
    name: "filter[category_id]",
    required: false,
    type: String,
    description: "Filter products by category id",
  })
  @ApiQuery({
    name: "filter[min_price]",
    required: false,
    type: String,
    description: "Filter products by minimum price",
  })
  @ApiQuery({
    name: "filter[max_price]",
    required: false,
    type: String,
    description: "Filter products by maximum price",
  })
  @ApiResponse({
    status: 200,
    description: "List of products",
    type: ProductsResponseDto,
  })
  @ApiInternalServerErrorResponse({
    description: "Internal server error",
    type: AppError,
    example: ErrorModel.INTERNAL_SERVER_ERROR,
  })
  findAll(
    @Query("take") take?: number,
    @Query("skip") skip?: number,
    @Query("searchString") searchString?: string,
    @Query("orderBy") orderBy?: "asc" | "desc",
    @Query("sortBy") sortBy?: "chipper" | "expensive" | "popular" | "discount",
    @Query("categoryId") categoryId?: string,
    @Query("parentCategoryId") parentCategoryId?: string,
    @Query("alias") alias?: string,
    @Query("categoryAlias") categoryAlias?: string,
    @Query("sale") sale?: boolean,
    @Query("novelty") novelty?: boolean,
    @Query("filter")
    filter?: {
      size_name?: string;
      category_id?: string;
      min_price?: number;
      max_price?: number;
    },
  ): Promise<ProductsResponseDto> {
    console.log(filter);
    return this.productsService.findAll({
      take: Number(take) || undefined,
      skip: Number(skip) || undefined,
      where: {
        name: {
          contains: searchString,
          mode: "insensitive",
        },
        productSizes: filter?.size_name && {
          some: {
            name: {
              in: filter.size_name.split(","),
            },
          },
        },
        price: filter?.min_price &&
          filter?.max_price && {
            gte: filter?.min_price ? +filter.min_price : undefined,
            lte: filter?.max_price ? +filter.max_price : undefined,
          },
        alias: alias ? alias : undefined,
        category: {
          id: categoryAlias
            ? undefined
            : categoryId || filter?.category_id
              ? {
                  in: [categoryId, filter?.category_id?.split(",")]
                    .filter(Boolean)
                    .flat(),
                }
              : undefined,
          alias: categoryAlias || undefined,
          parentCategoryId: categoryAlias ? undefined : parentCategoryId,
        },
        discount: sale ? { gt: 1 } : undefined,
        createdAt: novelty
          ? { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          : undefined,
      },
      orderBy: [
        {
          top: sortBy === "popular" ? "desc" : undefined,
        },
        {
          price: sortBy === "chipper" ? "asc" : undefined,
        },
        {
          price: sortBy === "expensive" ? "desc" : undefined,
        },
        {
          createdAt: orderBy ? orderBy : undefined,
        },
        {
          discount: sortBy === "discount" ? "desc" : undefined,
        },
      ],
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "Get product by ID" })
  @ApiParam({ name: "id", required: true, description: "Product ID" })
  @ApiResponse({
    status: 200,
    description: "Product details",
    type: ProductDto,
  })
  @ApiInternalServerErrorResponse({
    description: "Internal server error",
    type: AppError,
    example: ErrorModel.INTERNAL_SERVER_ERROR,
  })
  findOne(@Param("id") id: string): Promise<ProductDto> {
    return this.productsService.findOne({
      where: { id },
    });
  }

  @Get("alias/:alias")
  @ApiOperation({ summary: "Get product by alias with recommendations" })
  @ApiParam({ name: "alias", required: true, description: "Product alias" })
  @ApiResponse({
    status: 200,
    description: "Product details with recommendations",
    type: ProductWithRecommendationResponseDto,
  })
  @ApiInternalServerErrorResponse({
    description: "Internal server error",
    type: AppError,
    example: ErrorModel.INTERNAL_SERVER_ERROR,
  })
  async findAlias(
    @Param("alias") alias: string,
  ): Promise<ProductWithRecommendationResponseDto> {
    const product = await this.productsService.findOne({
      where: { alias },
    });
    if (!product) {
      return null;
    }
    const recommendations = await this.productsService.getRecommendedProducts({
      where: {
        category: {
          id: product.categoryId,
        },
      },
    });
    return {
      ...product,
      recommendations,
    };
  }

  @Get("sizes/all")
  @ApiOperation({ summary: "Get product sizes by category id" })
  @ApiQuery({
    name: "categoryId",
    required: false,
    description: "Category id",
  })
  @ApiResponse({
    status: 200,
    description: "Product sizes.",
    type: ProductSizesResponseDto,
  })
  @ApiInternalServerErrorResponse({
    description: "Internal server error",
    type: AppError,
    example: ErrorModel.INTERNAL_SERVER_ERROR,
  })
  getSizeByCategoryId(
    @Query("categoryId") categoryId?: string,
  ): Promise<ProductSizesResponseDto> {
    return this.productsService.getSizeByCategoryAlias(categoryId);
  }
}
