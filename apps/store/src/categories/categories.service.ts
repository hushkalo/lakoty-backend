import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Category, Prisma, User } from "@prisma/client";
import { ResponseDataType } from "../type/response-data.type";
import { ECodeErrors } from "@shared/enums/code-errors.enum";

@Injectable()
export class CategoriesService {
  constructor(
    private prisma: PrismaService,
    private readonly logger: Logger,
  ) {}

  async create(data: Prisma.CategoryCreateInput): Promise<Category> {
    return this.prisma.category.create({
      data,
    });
  }

  SERVICE = CategoriesService.name;

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
        `Category with ID ${params.where.alias || params.where.id} not found`,
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

  async update(params: {
    user: User;
    where: Prisma.CategoryWhereUniqueInput;
    data: Prisma.CategoryUpdateInput;
  }): Promise<Category> {
    const { user, ...restParams } = params;
    this.logger.log(
      `Update category with ID ${params.where.id}, body: ${JSON.stringify(restParams.data, null, 2)} user: ${user.id} ${user.email}`,
    );
    try {
      return this.prisma.category.update(restParams);
    } catch (e) {
      this.logger.error(e, e.stack, this.SERVICE);
      throw new InternalServerErrorException({
        message: ECodeErrors.INTERNAL_SERVER_ERROR_MESSAGE,
        error_code: ECodeErrors.INTERNAL_SERVER_ERROR_CODE,
      });
    }
  }
  async remove(where: Prisma.CategoryWhereUniqueInput): Promise<Category> {
    const category = await this.prisma.category.findUnique({
      where,
      include: {
        subCategories: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${where.id} not found`);
    }
    if (category.subCategories.length > 0) {
      await this.prisma.category.deleteMany({
        where: {
          parentCategoryId: where.id,
        },
      });
    }
    return this.prisma.category.delete({
      where,
    });
  }

  async isExist(where: Prisma.CategoryWhereUniqueInput): Promise<boolean> {
    const category = await this.prisma.category.findUnique({
      where,
    });
    return !!category;
  }
}
