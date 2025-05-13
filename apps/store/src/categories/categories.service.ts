import { Injectable } from "@nestjs/common";
import { Prisma, PrismaService } from "@libs/prisma-client";
import {
  CategoriesResponseDto,
  CategoryWithCountSubCategoriesResponseDto,
} from "./dto/responses.dto";
import { CategoryDto, TreeCategoryDto } from "./dto/category.dto";

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findOne(params: {
    where: Prisma.CategoryWhereUniqueInput;
  }): Promise<CategoryWithCountSubCategoriesResponseDto> {
    const category = await this.prisma.category.findUnique({
      ...params,
      include: {
        parentCategory: {
          omit: {
            keyCrmId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        subCategories: {
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
    return {
      ...category,
      countSubCategories: category.subCategories.length,
    };
  }

  countCategories(params?: {
    where?: Prisma.CategoryWhereInput;
  }): Promise<number> {
    return this.prisma.category.count(params);
  }

  async findAll(params?: {
    withSubCategories: boolean;
    searchString: string;
    skip?: number;
    take?: number;
    where?: Prisma.CategoryWhereInput;
    orderBy?: Prisma.CategoryOrderByWithRelationInput[];
  }): Promise<CategoriesResponseDto> {
    const { withSubCategories, searchString, ...restParams } = params;
    const count = await this.countCategories({
      where: {
        parentCategoryId: params.where.parentCategoryId,
        name: {
          contains: searchString,
          mode: "insensitive",
        },
      },
    });
    const data = await this.prisma.category.findMany({
      ...restParams,
      include: {
        subCategories: withSubCategories
          ? {
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
    return {
      data,
      total: count,
      to: data.length,
    };
  }

  async getTreeCategoriesById(
    categoryId: string,
  ): Promise<TreeCategoryDto | null> {
    const treeCategories = await this.getTreeCategories({
      isFlat: true,
      categoryId,
    });
    if (!treeCategories) {
      return null;
    }
    function buildCategoryAncestryTree(
      categories: TreeCategoryDto[],
      targetId: string,
    ) {
      const categoryMap = new Map<string, TreeCategoryDto>(
        categories.map((cat) => [cat.id, { ...cat, children: [] }]),
      );

      let current = categoryMap.get(targetId);
      if (!current) return null;

      while (current.parentCategoryId) {
        const parent = categoryMap.get(current.parentCategoryId);
        if (!parent) break;

        parent.children = [current];
        current = parent;
      }

      return current; // корень поддерева
    }
    return buildCategoryAncestryTree(treeCategories, categoryId);
  }

  async getTreeCategories(params: {
    isFlat: boolean;
    alias?: string;
    categoryId?: string;
    maxDepth?: string;
  }): Promise<TreeCategoryDto[] | null> {
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
      // Плоский список всех категорий с пустыми children
      return Array.from(categoryMap.values());
    }

    // Иначе — построить дерево
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

    return buildCategoryTree(data, maxDepth);
  }
}
