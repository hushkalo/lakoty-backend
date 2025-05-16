import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, User, PrismaService } from "@libs/prisma-client";
import { ErrorModel } from "@shared/error-model";
import { AllCategoriesResponseDto } from "./dto/response.dto";
import { CategoryDto } from "./dto/category.dto";

@Injectable()
export class CategoriesService {
  SERVICE = CategoriesService.name;

  constructor(
    private prisma: PrismaService,
    private readonly logger: Logger,
  ) {}

  async create(
    data: Prisma.CategoryCreateInput,
  ): Promise<Omit<CategoryDto, "subCategories" | "_count">> {
    const isExist = await this.isExist({
      alias: data.alias,
    });
    if (isExist) {
      throw new ConflictException(ErrorModel.CATEGORY_ALREADY_EXISTS);
    }
    try {
      return await this.prisma.category.create({
        data,
      });
    } catch (e) {
      if (e instanceof Error) {
        this.logger.error(e, e.stack, this.SERVICE);
      }
      throw new InternalServerErrorException(ErrorModel.INTERNAL_SERVER_ERROR);
    }
  }

  async findOne(params: {
    take?: number;
    skip?: number;
    where: Prisma.CategoryWhereUniqueInput;
  }): Promise<CategoryDto> {
    const category = await this.prisma.category.findUnique({
      where: params.where,
      include: {
        _count: true,
        subCategories: {
          take: params.take ? +params.take : undefined,
          skip: params.skip ? +params.skip : undefined,
        },
      },
    });
    if (params.where?.id && !category) {
      throw new NotFoundException(
        ErrorModel.CATEGORY_NOT_FOUND(params.where.id, "ID"),
      );
    }
    if (params.where?.id && !category) {
      throw new NotFoundException(
        ErrorModel.CATEGORY_NOT_FOUND(params.where.alias, "ALIAS"),
      );
    }
    if (!category) {
      throw new NotFoundException(ErrorModel.CATEGORY_DOES_NOT_EXIST);
    }
    return category;
  }

  async findAll(params?: {
    withSubCategories: boolean;
    skip?: number;
    take?: number;
    where?: Prisma.CategoryWhereInput;
    orderBy?: Prisma.CategoryOrderByWithRelationInput[];
  }): Promise<AllCategoriesResponseDto> {
    const { withSubCategories, take, skip, ...restParams } = params;
    const [categories, total] = await this.prisma.$transaction([
      this.prisma.category.findMany({
        ...restParams,
        take,
        skip,
        include: {
          _count: true,
          subCategories: withSubCategories,
        },
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
  }): Promise<Omit<CategoryDto, "subCategories" | "_count">> {
    const { user, ...restParams } = params;
    this.logger.log(
      `Update category with ID ${params.where.id}, body: ${JSON.stringify(restParams.data, null, 2)} user: ${user.id} ${user.email}`,
    );
    try {
      return this.prisma.category.update(restParams);
    } catch (e) {
      if (e instanceof Error) {
        this.logger.error(e, e.stack, this.SERVICE);
      }
      throw new InternalServerErrorException(ErrorModel.INTERNAL_SERVER_ERROR);
    }
  }

  async remove(
    where: Prisma.CategoryWhereUniqueInput,
  ): Promise<Omit<CategoryDto, "subCategories" | "_count">> {
    const category = await this.prisma.category.findUnique({
      where,
      include: {
        subCategories: true,
      },
    });

    if (!category) {
      throw new NotFoundException(
        ErrorModel.CATEGORY_NOT_FOUND(where.id, "ID"),
      );
    }
    if (category.subCategories.length > 0) {
      await this.prisma.category.updateMany({
        where: {
          parentCategoryId: where.id,
        },
        data: {
          parentCategoryId: null,
          hidden: true,
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
