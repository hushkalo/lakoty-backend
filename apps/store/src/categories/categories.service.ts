import { Injectable } from "@nestjs/common";
import { Prisma, PrismaService } from "@libs/prisma-client";
import {
  CategoriesResponseDto,
  CategoryWithCountSubCategoriesResponseDto,
} from "./dto/responses.dto";
import { CategoryDto, TreeCategoryDto } from "./dto/category.dto";
import { RedisService } from "../redis/redis.service";

@Injectable()
export class CategoriesService {
  constructor(
    private prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async findOne(params: {
    where: Prisma.CategoryWhereUniqueInput;
  }): Promise<CategoryWithCountSubCategoriesResponseDto> {
    const redisData =
      await this.redisService.get<CategoryWithCountSubCategoriesResponseDto>(
        `categories/findOne?${JSON.stringify(params)}`,
      );

    if (redisData) {
      return redisData;
    }

    const category = await this.prisma.category.findUnique({
      where: {
        ...params.where,
        isDeleted: false,
        hidden: false,
      },
      include: {
        parentCategory: {
          where: {
            isDeleted: false,
            hidden: false,
          },
          omit: {
            keyCrmId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        subCategories: {
          where: {
            isDeleted: false,
            hidden: false,
          },
          omit: {
            keyCrmId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      omit: {
        keyCrmId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!category) {
      return null;
    }

    const response = {
      ...category,
      countSubCategories: category.subCategories.length,
    };

    await this.redisService.set(
      `categories/findOne?${JSON.stringify(params)}`,
      response,
      60,
    );
    return response;
  }

  countCategories(params?: {
    where?: Prisma.CategoryWhereInput;
  }): Promise<number> {
    return this.prisma.category.count(params);
  }

  async findAll(params?: {
    withSubCategories: boolean;
    skip?: number;
    take?: number;
    where?: Prisma.CategoryWhereInput;
    orderBy?: Prisma.CategoryOrderByWithRelationInput[];
  }): Promise<CategoriesResponseDto> {
    const redisData = await this.redisService.get<CategoriesResponseDto>(
      `categories/findAll?${JSON.stringify(params)}`,
    );

    if (redisData) {
      return redisData;
    }

    const { withSubCategories, where, ...restParams } = params;
    const count = await this.countCategories({
      where: {
        ...where,
        isDeleted: false,
        hidden: false,
      },
    });
    const data = await this.prisma.category.findMany({
      ...restParams,
      where: {
        ...where,
        isDeleted: false,
        hidden: false,
      },
      include: {
        subCategories: withSubCategories
          ? {
              where: {
                isDeleted: false,
                hidden: false,
              },
              omit: {
                keyCrmId: true,
                createdAt: true,
                updatedAt: true,
              },
            }
          : false,
      },
      omit: {
        keyCrmId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const response = {
      data,
      total: count,
      to: data.length,
    };

    await this.redisService.set(
      `categories/findAll?${JSON.stringify(params)}`,
      response,
      60,
    );

    return response;
  }

  async getTreeCategoriesById(
    categoryId: string,
    flat = false,
  ): Promise<TreeCategoryDto | TreeCategoryDto[] | null> {
    const redisData = await this.redisService.get<
      TreeCategoryDto | TreeCategoryDto[]
    >(
      `categories/getTreeCategoriesById?categoriesId=${categoryId}&flat=${flat}`,
    );

    if (redisData) {
      return redisData;
    }

    const treeCategories = await this.getTreeCategories({
      isFlat: true,
      categoryId,
    });

    if (!treeCategories) {
      return null;
    }

    function buildCategorySubTree(
      categories: TreeCategoryDto[],
      targetId: string,
    ): TreeCategoryDto | null {
      const categoryMap = new Map<string, TreeCategoryDto>(
        categories.map((cat) => [cat.id, { ...cat, children: [] }]),
      );

      const targetCategory = categoryMap.get(targetId);
      if (!targetCategory) return null;

      for (const category of categories) {
        if (category.parentCategoryId) {
          const parent = categoryMap.get(category.parentCategoryId);
          const currentCategory = categoryMap.get(category.id);
          if (parent && currentCategory) {
            parent.children.push(currentCategory);
          }
        }
      }

      return targetCategory;
    }

    function flattenCategoryTree(category: TreeCategoryDto): TreeCategoryDto[] {
      const result: TreeCategoryDto[] = [{ ...category, children: [] }];
      for (const child of category.children) {
        result.push(...flattenCategoryTree(child));
      }
      return result;
    }

    const subTree = buildCategorySubTree(treeCategories, categoryId);
    if (!subTree) return null;

    if (flat) {
      const result = flattenCategoryTree(subTree);
      await this.redisService.set(
        `categories/getTreeCategoriesById?categoriesId=${categoryId}&flat=true`,
        result,
        60,
      );
      return result;
    }

    await this.redisService.set(
      `categories/getTreeCategoriesById?categoriesId=${categoryId}&flat=true`,
      subTree,
      60,
    );

    return subTree;
  }

  async getTreeCategories(params: {
    isFlat: boolean;
    alias?: string;
    categoryId?: string;
    maxDepth?: string;
  }): Promise<TreeCategoryDto[] | null> {
    const redisData = await this.redisService.get<TreeCategoryDto[]>(
      `categories/getTreeCategories?${JSON.stringify(params)}`,
    );

    if (redisData) {
      return redisData;
    }

    if (params.alias || params.categoryId) {
      const category = await this.findOne({
        where: {
          alias: params.alias,
          id: params.categoryId,
        },
      });
      if (!category) {
        return null;
      }
    }

    const data = await this.prisma.category.findMany({
      where: {
        isDeleted: false,
        hidden: false,
      },
      omit: {
        keyCrmId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const categoryMap = new Map<string, TreeCategoryDto>();
    data.forEach((cat) => {
      categoryMap.set(cat.id, { ...cat, children: [], pathname: [] });
    });

    if (params.isFlat) {
      const result = Array.from(categoryMap.values());

      await this.redisService.set(
        `categories/getTreeCategories?${JSON.stringify(params)}`,
        result,
        60,
      );

      return result;
    }

    const maxDepth = params.maxDepth ? parseInt(params.maxDepth) : undefined;

    function buildCategoryTree(
      categories: CategoryDto[],
      maxDepth?: number,
    ): TreeCategoryDto[] {
      const map = new Map<string, TreeCategoryDto>();
      const roots: TreeCategoryDto[] = [];

      for (const category of categories) {
        map.set(category.id, { ...category, children: [] });
      }

      for (const category of categories) {
        if (maxDepth && category.depth > maxDepth) continue;
        const node = map.get(category.id);
        if (category.parentCategoryId) {
          const parent = map.get(category.parentCategoryId);
          if (parent) {
            parent.children.push(node);
          }
        } else {
          roots.push(node);
        }
      }

      return roots;
    }

    const result = buildCategoryTree(data, maxDepth);

    await this.redisService.set(
      `categories/getTreeCategories?${JSON.stringify(params)}`,
      result,
      60,
    );

    return result;
  }

  async getAllSubCategoryIds(categoryId: string): Promise<string[]> {
    const redisData = await this.redisService.get<string[]>(
      `categories/getAllSubCategoryIds?categoryId=${categoryId}`,
    );

    if (redisData) {
      return redisData;
    }

    const rootCategory = await this.prisma.category.findUnique({
      where: {
        id: categoryId,
        isDeleted: false,
        hidden: false,
      },
      select: { id: true },
    });

    if (!rootCategory) {
      return [];
    }

    const categoryIds: string[] = [rootCategory.id];
    const stack: string[] = [rootCategory.id];

    while (stack.length > 0) {
      const currentId = stack.pop();
      const subCategories = await this.prisma.category.findMany({
        where: {
          parentCategoryId: currentId,
          isDeleted: false,
          hidden: false,
        },
        select: { id: true },
      });

      for (const subCat of subCategories) {
        categoryIds.push(subCat.id);
        stack.push(subCat.id);
      }
    }

    await this.redisService.set(
      `categories/getAllSubCategoryIds?categoryId=${categoryId}`,
      categoryIds,
      60,
    );

    return categoryIds;
  }
}
