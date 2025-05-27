import { Controller, Get, Param, Query } from "@nestjs/common";
import { CategoriesService } from "./categories.service";
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiParam,
  ApiInternalServerErrorResponse,
} from "@nestjs/swagger";
import {
  CategoriesResponseDto,
  CategoryWithCountSubCategoriesResponseDto,
} from "./dto/responses.dto";
import { TreeCategoryDto } from "./dto/category.dto";
import { AppError, ErrorModel } from "@shared/error-model";

@ApiTags("Categories")
@Controller("categories")
export class CategoriesController {
  constructor(private readonly categoryService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: "Get all root categories (paginated, searchable)" })
  @ApiQuery({
    name: "take",
    required: false,
    type: Number,
    description: "Limit the number of results",
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
    description: "Name search filter",
  })
  @ApiQuery({
    name: "orderBy",
    required: false,
    enum: ["top", "new", "depth"],
    description: "Order by name",
  })
  @ApiQuery({
    name: "withSubCategories",
    required: false,
    type: String,
    description: "Include subcategories (true/false)",
  })
  @ApiResponse({
    status: 200,
    description: "List of categories.",
    type: CategoriesResponseDto,
  })
  @ApiInternalServerErrorResponse({
    description: "Internal server error",
    type: AppError,
    example: ErrorModel.INTERNAL_SERVER_ERROR,
  })
  getAllCategories(
    @Query("take") take?: number,
    @Query("skip") skip?: number,
    @Query("searchString") searchString?: string,
    @Query("orderBy") orderBy?: "top" | "new" | "depth",
    @Query("withSubCategories") withSubCategories?: string,
  ): Promise<CategoriesResponseDto> {
    return this.categoryService.findAll({
      take: take ? +take : undefined,
      skip: skip ? +skip : undefined,
      where: {
        parentCategoryId: withSubCategories === "true" ? null : undefined,
        name: {
          contains: searchString,
          mode: "insensitive",
        },
      },
      orderBy: [
        {
          top: orderBy === "top" ? "desc" : undefined,
        },
        {
          createdAt: orderBy === "new" ? "desc" : undefined,
        },
        {
          depth: orderBy === "depth" ? "asc" : undefined,
        },
      ],
      withSubCategories: withSubCategories === "true",
    });
  }

  @Get("tree")
  @ApiOperation({ summary: "Get categories in tree or flat structure" })
  @ApiQuery({
    name: "flat",
    required: false,
    type: String,
    description: "Return flat structure instead of tree (true/false)",
  })
  @ApiQuery({
    name: "alias",
    required: false,
    type: String,
    description: "Is exist category by alias",
  })
  @ApiQuery({
    name: "categoryId",
    required: false,
    type: String,
    description: "Is exist category by ID",
  })
  @ApiQuery({
    name: "maxDepth",
    required: false,
    type: String,
    description: "Maximum depth of the tree",
  })
  @ApiResponse({
    status: 200,
    description: "List of categories in tree or flat structure.",
    type: [TreeCategoryDto],
  })
  @ApiInternalServerErrorResponse({
    description: "Internal server error",
    type: AppError,
    example: ErrorModel.INTERNAL_SERVER_ERROR,
  })
  getTreeCategories(
    @Query("flat") flat: string,
    @Query("alias") alias?: string,
    @Query("categoryId") categoryId?: string,
    @Query("maxDepth") maxDepth?: string,
  ): Promise<TreeCategoryDto[]> {
    return this.categoryService.getTreeCategories({
      isFlat: flat === "true",
      alias,
      categoryId,
      maxDepth,
    });
  }

  @Get("tree/:id")
  getTreeCategoryById(
    @Param("id") id: string,
  ): Promise<TreeCategoryDto | null> {
    return this.categoryService.getTreeCategoriesById(id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a category by its ID" })
  @ApiParam({ name: "id", required: true, description: "Category ID" })
  @ApiResponse({
    status: 200,
    description: "The requested category.",
    type: CategoryWithCountSubCategoriesResponseDto,
  })
  @ApiInternalServerErrorResponse({
    description: "Internal server error",
    type: AppError,
    example: ErrorModel.INTERNAL_SERVER_ERROR,
  })
  getCategory(@Param("id") id: string) {
    return this.categoryService.findOne({
      where: { id },
    });
  }

  @Get("alias/:alias")
  @ApiOperation({ summary: "Get a category by its alias" })
  @ApiParam({ name: "alias", required: true, description: "Category alias" })
  @ApiResponse({
    status: 200,
    description: "The requested category (by alias).",
    type: CategoryWithCountSubCategoriesResponseDto,
  })
  @ApiInternalServerErrorResponse({
    description: "Internal server error",
    type: AppError,
    example: ErrorModel.INTERNAL_SERVER_ERROR,
  })
  async getCategoryByAlias(
    @Param("alias") alias: string,
  ): Promise<CategoryWithCountSubCategoriesResponseDto> {
    return this.categoryService.findOne({
      where: { alias },
    });
  }
}
