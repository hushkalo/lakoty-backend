import { Injectable, NotFoundException } from "@nestjs/common";
import { Category, Prisma, PrismaService } from "@libs/prisma-client";
import { ResponseDataType } from "@shared/types";
import { ErrorModel } from "@shared/error-model";

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findOne(params: {
    where: Prisma.CategoryWhereUniqueInput;
    include?: Prisma.CategoryInclude;
    omit?: Prisma.CategoryOmit;
    select?: Prisma.CategorySelect;
  }): Promise<(Category & { countSubCategories: number }) | null> {
    const category = await this.prisma.category.findUnique({
      ...params,
    });
    if (!category) {
      throw new NotFoundException(
        ErrorModel.CATEGORY_NOT_FOUND(params.where.id || params.where.alias),
      );
    }
    const countSubCategories = await this.prisma.category.count({
      where: {
        parentCategoryId: category.id,
      },
    });
    return { ...category, countSubCategories };
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.CategoryWhereInput;
    orderBy?: Prisma.CategoryOrderByWithRelationInput;
    omit?: Prisma.CategoryOmit;
    include?: Prisma.CategoryInclude;
  }): Promise<ResponseDataType<Category[]>> {
    const { omit, include, ...restParams } = params;
    const [categories, total] = await this.prisma.$transaction([
      this.prisma.category.findMany({
        ...params,
        omit,
        include,
      }),
      this.prisma.category.count({
        ...restParams,
      }),
    ]);
    return {
      data: categories,
      total,
      to: categories.length,
    };
  }
}
