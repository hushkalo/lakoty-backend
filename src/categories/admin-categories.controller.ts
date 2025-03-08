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
} from "@nestjs/common";
import { CategoriesService } from "./categories.service";
import { Category as CategoryModel, User as UserModel } from "@prisma/client";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { ResponseDataType } from "../type/response-data.type";
import { JwtGuard } from "../guards/jwt.guard";
import { Request } from "express";
import { User } from "../decorators/user.decorator";

@Controller("admin/categories")
export class AdminCategoriesController {
  constructor(private readonly categoryService: CategoriesService) {}

  @UseGuards(JwtGuard)
  @Get()
  async getAllCategoriesAdmin(
    @Req() request: Request,
    @Query("take") take?: number,
    @Query("skip") skip?: number,
    @Query("searchString") searchString?: string,
    @Query("orderBy") orderBy?: "asc" | "desc",
    @Query("withSubCategories") withSubCategories?: string,
  ): Promise<ResponseDataType<CategoryModel[]>> {
    return this.categoryService.findAll({
      take: take ? +take : undefined,
      skip: skip ? +skip : undefined,
      where: {
        parentCategoryId: null,
        name: {
          contains: searchString,
          mode: "insensitive",
        },
      },
      include: {
        subCategories: withSubCategories === "true",
      },
      orderBy: {
        name: orderBy ? orderBy : undefined,
      },
    });
  }

  @UseGuards(JwtGuard)
  @Get(":id")
  async getCategory(
    @Param("id") id: string,
    @Query("take") take?: number,
    @Query("skip") skip?: number,
  ): Promise<CategoryModel> {
    return this.categoryService.findOne({
      where: { id },
      include: {
        subCategories: {
          take: take ? +take : undefined,
          skip: skip ? +skip : undefined,
        },
      },
    });
  }

  @UseGuards(JwtGuard)
  @Get("alias/:alias")
  async getCategoryByAlias(
    @Param("alias") alias: string,
    @Query("take") take?: number,
    @Query("skip") skip?: number,
  ): Promise<CategoryModel> {
    return this.categoryService.findOne({
      where: { alias },
      include: {
        subCategories: {
          take: take ? +take : undefined,
          skip: skip ? +skip : undefined,
        },
      },
    });
  }

  @UseGuards(JwtGuard)
  @Post("create")
  async createCategory(
    @Body() data: CreateCategoryDto,
  ): Promise<CategoryModel> {
    return this.categoryService.create(data);
  }

  @UseGuards(JwtGuard)
  @Patch("update/:id")
  async updateCategory(
    @Param("id") id: string,
    @Body() data: UpdateCategoryDto,
    @User() user: UserModel,
  ): Promise<CategoryModel> {
    return this.categoryService.update({
      user,
      where: { id },
      data,
    });
  }

  @UseGuards(JwtGuard)
  @Delete("delete/:id")
  async deleteCategory(@Param("id") id: string): Promise<CategoryModel> {
    return this.categoryService.remove({
      id,
    });
  }
}
