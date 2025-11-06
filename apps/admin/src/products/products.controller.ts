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
  UsePipes,
} from "@nestjs/common";
import { ProductsService } from "./products.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { JwtGuard } from "../guards/jwt.guard";
import { User } from "../decorators/user.decorator";
import { User as UserModel } from "@libs/prisma-client";
import { ValidationPipe } from "../pipes/validation.pipe";
import {
  AllProductsResponseDto,
  CreateProductResponseDto,
} from "./dto/response.dto";
import { ProductDto } from "./dto/product.dto";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
} from "@nestjs/swagger";
import {
  AppError,
  AppErrorValidationWithArray,
  ErrorModel,
} from "@shared/error-model";
import { CrmProductDto } from "./dto/crm-product.dto";

@ApiTags("Products")
@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @ApiOperation({ summary: "Create new product" })
  @ApiCreatedResponse({
    description: "Product successfully created",
    type: CreateProductResponseDto,
  })
  @ApiBadRequestResponse({
    description: "Bad Request",
    type: AppErrorValidationWithArray,
    example: {
      ...ErrorModel.VALIDATION_FAILED,
      errorsReason: [
        {
          error_code: "VALIDATION_FAILED",
          message: "Validation failed.",
          errorsReason: [
            {
              key: "name",
              constraints: {
                isNotEmpty: "name should not be empty",
                isString: "name must be a string",
              },
            },
            {
              key: "description",
              constraints: {
                isNotEmpty: "description should not be empty",
                isString: "description must be a string",
              },
            },
            {
              key: "price",
              constraints: {
                min: "price must not be less than 0",
                isNumber:
                  "price must be a number conforming to the specified constraints",
              },
            },
            {
              key: "alias",
              constraints: {
                isNotEmpty: "alias should not be empty",
                isString: "alias must be a string",
              },
            },
            {
              key: "categoryId",
              constraints: {
                isNotEmpty: "categoryId should not be empty",
                isString: "categoryId must be a string",
              },
            },
            {
              key: "quantity",
              constraints: {
                min: "quantity must not be less than 0",
                isNumber:
                  "quantity must be a number conforming to the specified constraints",
              },
            },
            {
              key: "images",
              constraints: {
                arrayMinSize: "images must contain at least 1 elements",
                isArray: "images must be an array",
              },
            },
            {
              key: "discount",
              constraints: {
                max: "discount must not be greater than 100",
                min: "discount must not be less than 0",
                isNumber:
                  "discount must be a number conforming to the specified constraints",
              },
            },
            {
              key: "top",
              constraints: {
                isBoolean: "top must be a boolean value",
              },
            },
            {
              key: "isCreateOnCrm",
              constraints: {
                isBoolean: "isCreateOnCrm must be a boolean value",
              },
            },
            {
              key: "productSizes",
              constraints: {
                arrayMinSize: "productSizes must contain at least 1 elements",
              },
              "constraints error with array": [
                {
                  index: "0",
                  values: [
                    {
                      key: "url",
                      constraints: {
                        isNotEmpty: "url should not be empty",
                        isUrl: "url must be a URL address",
                      },
                    },
                    {
                      key: "order",
                      constraints: {
                        min: "order must not be less than 0",
                        isNumber:
                          "order must be a number conforming to the specified constraints",
                      },
                    },
                  ],
                },
              ],
            },
            {
              key: "images",
              constraints: {
                arrayMinSize: "images must contain at least 1 elements",
              },
              "constraints error with array": [
                {
                  index: "0",
                  values: [
                    {
                      key: "name",
                      constraints: {
                        isNotEmpty: "name should not be empty",
                        isString: "name must be a string",
                      },
                    },
                    {
                      key: "sku",
                      constraints: {
                        isNotEmpty: "sku should not be empty",
                        isString: "sku must be a string",
                      },
                    },
                    {
                      key: "quantity",
                      constraints: {
                        min: "quantity must not be less than 0",
                        isNumber:
                          "quantity must be a number conforming to the specified constraints",
                      },
                    },
                    {
                      key: "isAvailable",
                      constraints: {
                        isBoolean: "isAvailable must be a boolean value",
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({
    description: "Unauthorized",
    type: AppError,
    example: ErrorModel.USER_UNAUTHORIZED,
  })
  @UsePipes(ValidationPipe)
  @UseGuards(JwtGuard)
  @Post("create")
  create(
    @Body() data: CreateProductDto,
    @User() user: UserModel,
  ): Promise<
    Omit<ProductDto, "_count" | "category" | "images" | "productSizes">
  > {
    return this.productsService.create({ data, user });
  }

  @ApiOperation({ summary: "Get all products" })
  @ApiQuery({
    name: "take",
    required: false,
    type: Number,
    description: "Number of records to take",
  })
  @ApiQuery({
    name: "skip",
    required: false,
    type: Number,
    description: "Number of records to skip",
  })
  @ApiQuery({
    name: "searchString",
    required: false,
    type: String,
    description: "Search by product name",
  })
  @ApiQuery({ name: "sortByCreatedAt", required: false, enum: ["asc", "desc"] })
  @ApiQuery({ name: "sortByUpdatedAt", required: false, enum: ["asc", "desc"] })
  @ApiQuery({ name: "sortByName", required: false, enum: ["asc", "desc"] })
  @ApiQuery({ name: "sortByAlias", required: false, enum: ["asc", "desc"] })
  @ApiQuery({ name: "sortByTop", required: false, enum: ["asc", "desc"] })
  @ApiQuery({ name: "sortByPrice", required: false, enum: ["asc", "desc"] })
  @ApiQuery({
    name: "categoryId",
    required: false,
    type: String,
    description: "Filter by category ID",
  })
  @ApiQuery({
    name: "categoryAlias",
    required: false,
    type: String,
    description: "Filter by category alias",
  })
  @ApiResponse({
    status: 200,
    description: "Products successfully retrieved",
    type: AllProductsResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "Unauthorized",
    type: AppError,
    example: ErrorModel.USER_UNAUTHORIZED,
  })
  @UseGuards(JwtGuard)
  @Get()
  findAll(
    @Query("take") take?: number,
    @Query("skip") skip?: number,
    @Query("searchString") searchString?: string,
    @Query("sortByCreatedAt") sortByCreatedAt?: "asc" | "desc",
    @Query("sortByUpdatedAt") sortByUpdatedAt?: "asc" | "desc",
    @Query("sortByName") sortByName?: "asc" | "desc",
    @Query("sortByAlias") sortByAlias?: "asc" | "desc",
    @Query("sortByTop") sortByTop?: "asc" | "desc",
    @Query("sortByPrice") sortByPrice?: "asc" | "desc",
    @Query("categoryId") categoryId?: string,
    @Query("categoryAlias") categoryAlias?: string,
  ): Promise<AllProductsResponseDto> {
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
      orderBy: [
        {
          top: sortByTop ? sortByTop : undefined,
        },
        {
          createdAt: sortByCreatedAt ? sortByCreatedAt : undefined,
        },
        {
          updatedAt: sortByUpdatedAt ? sortByUpdatedAt : undefined,
        },
        {
          name: sortByName ? sortByName : undefined,
        },
        {
          alias: sortByAlias ? sortByAlias : undefined,
        },
        {
          price: sortByPrice ? sortByPrice : undefined,
        },
      ],
    });
  }

  @ApiOperation({ summary: "Get product by ID" })
  @ApiParam({ name: "id", description: "Product ID" })
  @ApiResponse({
    status: 200,
    description: "Product successfully retrieved",
    type: ProductDto,
  })
  @ApiUnauthorizedResponse({
    description: "Unauthorized",
    type: AppError,
    example: ErrorModel.USER_UNAUTHORIZED,
  })
  @ApiNotFoundResponse({
    description: "Product not found",
    type: AppError,
    example: ErrorModel.PRODUCT_DOES_NOT_EXIST,
  })
  @UseGuards(JwtGuard)
  @Get(":id")
  findOne(@Param("id") id: string): Promise<ProductDto> {
    return this.productsService.findOne({
      where: { id },
    });
  }

  @ApiOperation({ summary: "Get product from CRM by ID" })
  @ApiParam({ name: "id", description: "Product ID" })
  @ApiResponse({
    status: 200,
    description: "Product successfully retrieved from CRM",
    type: CrmProductDto,
  })
  @ApiUnauthorizedResponse({
    description: "Unauthorized",
    type: AppError,
    example: ErrorModel.USER_UNAUTHORIZED,
  })
  @ApiNotFoundResponse({
    description: "Product not found in CRM",
    type: AppError,
    example: ErrorModel.PRODUCT_DOES_NOT_EXIST,
  })
  @ApiInternalServerErrorResponse({
    description: "Internal server error",
    type: AppError,
    example: ErrorModel.INTERNAL_SERVER_ERROR,
  })
  @Get("keycrm/:id")
  getProductFromCrm(@Param("id") id: string): Promise<CrmProductDto> {
    return this.productsService.getProductFromCrm({ id });
  }

  @ApiOperation({ summary: "Get product by alias" })
  @ApiParam({ name: "alias", description: "Product alias" })
  @ApiResponse({
    status: 200,
    description: "Product successfully retrieved",
    type: ProductDto,
  })
  @ApiUnauthorizedResponse({
    description: "Unauthorized",
    type: AppError,
    example: ErrorModel.USER_UNAUTHORIZED,
  })
  @ApiNotFoundResponse({
    description: "Product not found",
    type: AppError,
    example: ErrorModel.PRODUCT_DOES_NOT_EXIST,
  })
  @UseGuards(JwtGuard)
  @Get("alias/:alias")
  async findAlias(@Param("alias") alias: string): Promise<ProductDto> {
    return this.productsService.findOne({
      where: { alias },
    });
  }

  @ApiOperation({ summary: "Update product" })
  @ApiParam({ name: "id", description: "Product ID" })
  @ApiResponse({
    status: 200,
    description: "Product successfully updated",
    type: ProductDto,
  })
  @ApiBadRequestResponse({
    description: "Bad Request",
    type: AppErrorValidationWithArray,
    example: {
      ...ErrorModel.VALIDATION_FAILED,
      errorsReason: [
        {
          error_code: "VALIDATION_FAILED",
          message: "Validation failed.",
          errorsReason: [
            {
              key: "name",
              constraints: {
                isNotEmpty: "name should not be empty",
                isString: "name must be a string",
              },
            },
            {
              key: "description",
              constraints: {
                isNotEmpty: "description should not be empty",
                isString: "description must be a string",
              },
            },
            {
              key: "price",
              constraints: {
                min: "price must not be less than 0",
                isNumber:
                  "price must be a number conforming to the specified constraints",
              },
            },
            {
              key: "alias",
              constraints: {
                isNotEmpty: "alias should not be empty",
                isString: "alias must be a string",
              },
            },
            {
              key: "categoryId",
              constraints: {
                isNotEmpty: "categoryId should not be empty",
                isString: "categoryId must be a string",
              },
            },
            {
              key: "quantity",
              constraints: {
                min: "quantity must not be less than 0",
                isNumber:
                  "quantity must be a number conforming to the specified constraints",
              },
            },
            {
              key: "images",
              constraints: {
                arrayMinSize: "images must contain at least 1 elements",
                isArray: "images must be an array",
              },
            },
            {
              key: "discount",
              constraints: {
                max: "discount must not be greater than 100",
                min: "discount must not be less than 0",
                isNumber:
                  "discount must be a number conforming to the specified constraints",
              },
            },
            {
              key: "top",
              constraints: {
                isBoolean: "top must be a boolean value",
              },
            },
            {
              key: "isCreateOnCrm",
              constraints: {
                isBoolean: "isCreateOnCrm must be a boolean value",
              },
            },
            {
              key: "productSizes",
              constraints: {
                arrayMinSize: "productSizes must contain at least 1 elements",
              },
              "constraints error with array": [
                {
                  index: "0",
                  values: [
                    {
                      key: "url",
                      constraints: {
                        isNotEmpty: "url should not be empty",
                        isUrl: "url must be a URL address",
                      },
                    },
                    {
                      key: "order",
                      constraints: {
                        min: "order must not be less than 0",
                        isNumber:
                          "order must be a number conforming to the specified constraints",
                      },
                    },
                  ],
                },
              ],
            },
            {
              key: "images",
              constraints: {
                arrayMinSize: "images must contain at least 1 elements",
              },
              "constraints error with array": [
                {
                  index: "0",
                  values: [
                    {
                      key: "name",
                      constraints: {
                        isNotEmpty: "name should not be empty",
                        isString: "name must be a string",
                      },
                    },
                    {
                      key: "sku",
                      constraints: {
                        isNotEmpty: "sku should not be empty",
                        isString: "sku must be a string",
                      },
                    },
                    {
                      key: "quantity",
                      constraints: {
                        min: "quantity must not be less than 0",
                        isNumber:
                          "quantity must be a number conforming to the specified constraints",
                      },
                    },
                    {
                      key: "isAvailable",
                      constraints: {
                        isBoolean: "isAvailable must be a boolean value",
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({
    description: "Unauthorized",
    type: AppError,
    example: ErrorModel.USER_UNAUTHORIZED,
  })
  @ApiNotFoundResponse({
    description: "Product not found",
    type: AppError,
    example: ErrorModel.PRODUCT_DOES_NOT_EXIST,
  })
  @UsePipes(ValidationPipe)
  @UseGuards(JwtGuard)
  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() data: UpdateProductDto,
  ): Promise<ProductDto> {
    return this.productsService.update({
      where: {
        id,
      },
      data,
    });
  }

  @ApiOperation({ summary: "Delete product" })
  @ApiParam({ name: "id", description: "Product ID" })
  @ApiResponse({
    status: 200,
    description: "Product successfully deleted",
    type: ProductDto,
  })
  @ApiUnauthorizedResponse({
    description: "Unauthorized",
    type: AppError,
    example: ErrorModel.USER_UNAUTHORIZED,
  })
  @ApiNotFoundResponse({
    description: "Product not found",
    type: AppError,
    example: ErrorModel.PRODUCT_DOES_NOT_EXIST,
  })
  @UseGuards(JwtGuard)
  @Delete(":id")
  remove(
    @Param("id") id: string,
    @User() user: UserModel,
  ): Promise<ProductDto> {
    return this.productsService.remove({
      where: {
        id,
      },
      user,
    });
  }
}
