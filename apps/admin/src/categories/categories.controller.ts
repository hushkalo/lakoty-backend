import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UsePipes,
} from "@nestjs/common";
import { CategoriesService } from "./categories.service";
import { User as UserModel } from "@libs/prisma-client";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { JwtGuard } from "../guards/jwt.guard";
import { Request } from "express";
import { User } from "../decorators/user.decorator";
import {
  AllCategoriesResponseDto,
  CreateCategoryResponseDto,
} from "./dto/response.dto";
import { CategoryDto } from "./dto/category.dto";
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiBody,
  ApiInternalServerErrorResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
} from "@nestjs/swagger";
import { AppError, AppErrorValidation, ErrorModel } from "@shared/error-model";
import { ValidationPipe } from "../pipes/validation.pipe";

@ApiTags("Categories")
@ApiBearerAuth()
@Controller("categories")
export class CategoriesController {
  constructor(private readonly categoryService: CategoriesService) {}

  @ApiOperation({ summary: "Get all categories with filtering and pagination" })
  @ApiResponse({
    status: 200,
    description: "Returns list of categories",
    type: AllCategoriesResponseDto,
  })
  @ApiQuery({
    name: "take",
    required: false,
    description: "Number of items to take",
  })
  @ApiQuery({
    name: "skip",
    required: false,
    description: "Number of items to skip",
  })
  @ApiQuery({
    name: "searchString",
    required: false,
    description: "Search categories by name",
  })
  @ApiQuery({ name: "sortByCreatedAt", required: false, enum: ["asc", "desc"] })
  @ApiQuery({ name: "sortByUpdatedAt", required: false, enum: ["asc", "desc"] })
  @ApiQuery({ name: "sortByName", required: false, enum: ["asc", "desc"] })
  @ApiQuery({ name: "sortByAlias", required: false, enum: ["asc", "desc"] })
  @ApiQuery({ name: "sortByTop", required: false, enum: ["asc", "desc"] })
  @ApiQuery({ name: "sortByDepth", required: false, enum: ["asc", "desc"] })
  @ApiQuery({ name: "withSubCategories", required: false, type: "boolean" })
  @UseGuards(JwtGuard)
  @Get()
  async getAllCategories(
    @Req() request: Request,
    @Query("take") take?: number,
    @Query("skip") skip?: number,
    @Query("searchString") searchString?: string,
    @Query("sortByCreatedAt") sortByCreatedAt?: "asc" | "desc",
    @Query("sortByUpdatedAt") sortByUpdatedAt?: "asc" | "desc",
    @Query("sortByName") sortByName?: "asc" | "desc",
    @Query("sortByAlias") sortByAlias?: "asc" | "desc",
    @Query("sortByTop") sortByTop?: "asc" | "desc",
    @Query("sortByDepth") sortByDepth?: "asc" | "desc",
    @Query("withSubCategories") withSubCategories?: string,
  ): Promise<AllCategoriesResponseDto> {
    return this.categoryService.findAll({
      take: take ? +take : undefined,
      skip: skip ? +skip : undefined,
      where: {
        name: {
          contains: searchString,
          mode: "insensitive",
        },
        isDeleted: false,
      },
      withSubCategories: withSubCategories === "true",
      orderBy: [
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
          top: sortByTop ? sortByTop : undefined,
        },
        {
          depth: sortByDepth ? sortByDepth : undefined,
        },
      ],
    });
  }

  @ApiOperation({ summary: "Get category by ID" })
  @ApiResponse({
    status: 200,
    description: "Returns a category",
    type: CategoryDto,
  })
  @ApiParam({ name: "id", description: "Category ID" })
  @ApiQuery({
    name: "take",
    required: false,
    description: "Number of items to take",
  })
  @ApiQuery({
    name: "skip",
    required: false,
    description: "Number of items to skip",
  })
  @ApiNotFoundResponse({
    description: "Category not found",
    type: AppError,
    example: ErrorModel.CATEGORY_NOT_FOUND("clt0yzpbi0000mt08g3l0w123", "ID"),
  })
  @UseGuards(JwtGuard)
  @Get(":id")
  async getCategoryById(
    @Param("id") id: string,
    @Query("take") take?: number,
    @Query("skip") skip?: number,
  ): Promise<CategoryDto> {
    return this.categoryService.findOne({
      take: take ? +take : undefined,
      skip: skip ? +skip : undefined,
      where: { id },
    });
  }

  @ApiOperation({ summary: "Get category by alias" })
  @ApiResponse({
    status: 200,
    description: "Returns a category",
    type: CategoryDto,
  })
  @ApiParam({ name: "alias", description: "Category alias" })
  @ApiQuery({
    name: "take",
    required: false,
    description: "Number of items to take",
  })
  @ApiQuery({
    name: "skip",
    required: false,
    description: "Number of items to skip",
  })
  @ApiNotFoundResponse({
    description: "Category not found",
    type: AppError,
    example: ErrorModel.CATEGORY_NOT_FOUND("shoose", "ALIAS"),
  })
  @UseGuards(JwtGuard)
  @Get("alias/:alias")
  async getCategoryByAlias(
    @Param("alias") alias: string,
    @Query("take") take?: number,
    @Query("skip") skip?: number,
  ): Promise<CategoryDto> {
    return this.categoryService.findOne({
      take: take ? +take : undefined,
      skip: skip ? +skip : undefined,
      where: { alias },
    });
  }

  @ApiOperation({ summary: "Create new category" })
  @ApiResponse({
    status: 201,
    description: "Category created successfully",
    type: CreateCategoryResponseDto,
  })
  @ApiInternalServerErrorResponse({
    description: "Internal server error",
    type: AppError,
    example: ErrorModel.INTERNAL_SERVER_ERROR,
  })
  @ApiBadRequestResponse({
    description: "Bad request",
    type: AppErrorValidation,
    example: {
      ...ErrorModel.VALIDATION_FAILED,
      errorsReason: [
        {
          key: "name",
          constraints: {
            maxLength: "name must be shorter than or equal to 100 characters",
            minLength: "name must be longer than or equal to 2 characters",
            isString: "name must be a string",
          },
        },
        {
          key: "keyCrmId",
          constraints: {
            isNumber:
              "keyCrmId must be a number conforming to the specified constraints",
          },
        },
        {
          key: "alias",
          constraints: {
            maxLength: "alias must be shorter than or equal to 100 characters",
            minLength: "alias must be longer than or equal to 2 characters",
            isString: "alias must be a string",
          },
        },
        {
          key: "imageUrl",
          constraints: {
            isUrl: "imageUrl must be a URL address",
          },
        },
      ],
    },
  })
  @ApiConflictResponse({
    description: "Category already exists",
    type: AppError,
    example: ErrorModel.CATEGORY_ALREADY_EXISTS,
  })
  @ApiNotFoundResponse({
    description: "Parent category not found",
    type: AppError,
    example: ErrorModel.CATEGORY_NOT_FOUND("clt0yzpbi0000mt08g3l0w123", "ID"),
  })
  @ApiBody({
    type: CreateCategoryDto,
    description: "Data for creating a new category",
  })
  @UsePipes(ValidationPipe)
  @UseGuards(JwtGuard)
  @Post("create")
  async createCategory(
    @Body() data: CreateCategoryDto,
  ): Promise<Omit<CategoryDto, "subCategories" | "_count">> {
    return this.categoryService.create(data);
  }

  @ApiOperation({ summary: "Update category" })
  @ApiResponse({
    status: 200,
    description: "Category updated successfully",
    type: CreateCategoryResponseDto,
  })
  @ApiConflictResponse({
    description: "Category already exists",
    type: AppError,
    example: ErrorModel.CATEGORY_ALREADY_EXISTS,
  })
  @ApiBody({
    type: UpdateCategoryDto,
    description: "Data for updating the category",
  })
  @ApiParam({ name: "id", description: "Category ID" })
  @UseGuards(JwtGuard)
  @Patch("update/:id")
  async updateCategory(
    @Param("id") id: string,
    @Body() data: UpdateCategoryDto,
    @User() user: UserModel,
  ): Promise<Omit<CategoryDto, "subCategories" | "_count">> {
    return this.categoryService.update({
      user,
      where: { id },
      data,
    });
  }

  @ApiOperation({ summary: "Delete category" })
  @ApiResponse({
    status: 200,
    description: "Category deleted successfully",
    type: CreateCategoryResponseDto,
  })
  @ApiNotFoundResponse({
    description: "Category not found",
    type: AppError,
    example: ErrorModel.CATEGORY_NOT_FOUND("clt0yzpbi0000mt08g3l0w123", "ID"),
  })
  @ApiParam({ name: "id", description: "Category ID" })
  @UseGuards(JwtGuard)
  @Delete("delete/:id")
  async deleteCategory(
    @Param("id") id: string,
  ): Promise<Omit<CategoryDto, "subCategories" | "_count">> {
    return this.categoryService.remove({
      id,
    });
  }
}
