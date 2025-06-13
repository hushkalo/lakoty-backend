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
    skip?: number;
    take?: number;
    where?: Prisma.CategoryWhereInput;
    orderBy?: Prisma.CategoryOrderByWithRelationInput[];
  }): Promise<CategoriesResponseDto> {
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
    return {
      data,
      total: count,
      to: data.length,
    };
  }

  async getTreeCategoriesById(
    categoryId: string,
    flat = false,
  ): Promise<TreeCategoryDto | TreeCategoryDto[] | null> {
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

    // Если flat === true, возвращаем плоский список
    if (flat) {
      return flattenCategoryTree(subTree);
    }

    // Иначе возвращаем поддерево
    return subTree;
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

  async getAllSubCategoryIds(categoryId: string): Promise<string[]> {
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

    // Рекурсивно собираем ID подкатегорий
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

    return categoryIds;
  }
}
