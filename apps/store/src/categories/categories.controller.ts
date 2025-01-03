import { Controller, Get, Param, Query } from "@nestjs/common";
import { CategoriesService } from "./categories.service";
import { Category as CategoryModel } from "@prisma/client";
import { ResponseDataType } from "../type/response-data.type";

@Controller("categories")
export class CategoriesController {
  constructor(private readonly categoryService: CategoriesService) {}

  @Get()
  async getAllCategories(
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
      omit: {
        keyCrmId: true,
        parentCategoryId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  @Get(":id")
  async getCategory(@Param("id") id: string): Promise<CategoryModel> {
    return this.categoryService.findOne({
      where: { id },
      omit: {
        keyCrmId: true,
        parentCategoryId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  @Get("alias/:alias")
  async getCategoryByAlias(
    @Param("alias") alias: string,
  ): Promise<CategoryModel> {
    return this.categoryService.findOne({
      where: { alias },
      include: {
        subCategories: {
          omit: {
            keyCrmId: true,
            parentCategoryId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      omit: {
        keyCrmId: true,
        parentCategoryId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
