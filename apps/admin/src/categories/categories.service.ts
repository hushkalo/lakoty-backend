import {
  BadRequestException,
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
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@Injectable()
export class CategoriesService {
  SERVICE = CategoriesService.name;

  constructor(
    private prisma: PrismaService,
    private readonly logger: Logger,
  ) {}

  async create(
    data: CreateCategoryDto,
  ): Promise<Omit<CategoryDto, "subCategories" | "_count">> {
    const isExist = await this.isExist({
      alias: data.alias,
    });
    if (isExist) {
      throw new ConflictException(ErrorModel.CATEGORY_ALREADY_EXISTS);
    }
    const pathname: string[] = [];
    if (data.parentCategoryId) {
      const parentCategory = await this.findOne({
        where: {
          id: data.parentCategoryId,
        },
      });
      if (!parentCategory) {
        throw new NotFoundException(
          ErrorModel.CATEGORY_NOT_FOUND(data.parentCategoryId, "ID"),
        );
      }
      pathname.push(...parentCategory.pathname);
    }
    pathname.push(data.alias);
    try {
      return await this.prisma.category.create({
        data: {
          ...data,
          pathname,
          depth: pathname.length - 1,
        },
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
      where: {
        ...params.where,
        isDeleted: false,
      },
      include: {
        _count: true,
        subCategories: {
          take: params.take ? +params.take : undefined,
          skip: params.skip ? +params.skip : undefined,
        },
      },
      omit: {
        isDeleted: true,
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
    data: UpdateCategoryDto;
  }): Promise<Omit<CategoryDto, "subCategories" | "_count">> {
    const { user, data, where } = params;
    const category = await this.prisma.category.findUnique({
      where: {
        ...where,
        isDeleted: false,
      },
      include: {
        _count: true,
        subCategories: true,
      },
    });
    if (!category) {
      throw new NotFoundException(
        ErrorModel.CATEGORY_NOT_FOUND(where.id, "ID"),
      );
    }
    const categoryPathname: string[] = [];
    if (data.alias) {
      const isExistAlias = await this.prisma.category.findUnique({
        where: {
          alias: data.alias,
          isDeleted: false,
        },
      });
      if (isExistAlias && isExistAlias.id !== where.id) {
        throw new ConflictException(ErrorModel.CATEGORY_ALREADY_EXISTS);
      }
      category.pathname.forEach((item, index) => {
        if (index === category.depth) {
          return categoryPathname.push(data.alias);
        }
        categoryPathname.push(item);
      });
    }
    if (data.parentCategoryId) {
      await this.findOne({
        where: {
          id: data.parentCategoryId,
        },
      });
    }
    this.logger.log(
      `Update category with ID ${where.id}, body: ${JSON.stringify(data, null, 2)} user: ${user.id} ${user.email}`,
    );

    try {
      return this.prisma.$transaction(async (prisma) => {
        if (
          data?.parentCategoryId &&
          category.parentCategoryId !== data.parentCategoryId
        ) {
          const hasParent = !!data.parentCategoryId;
          let parentCategory: CategoryDto | null = null;

          if (hasParent) {
            parentCategory = await this.findOne({
              where: { id: data.parentCategoryId },
            });

            if (parentCategory.id === category.id) {
              throw new BadRequestException(
                ErrorModel.CATEGORY_DOES_NOT_BE_CHILD_OWN_CATEGORY,
              );
            }
          }

          const childCategories = await prisma.category.findMany({
            where: {
              pathname: { has: category.alias },
              isDeleted: false,
            },
            include: { _count: true },
            orderBy: { depth: "asc" },
          });

          const list = new Map<string, string[]>();

          await Promise.all(
            childCategories.map(async (child) => {
              const isRoot = category.id === child.id;
              const parentPath = isRoot
                ? hasParent
                  ? [...parentCategory.pathname, child.alias]
                  : [child.alias]
                : [...(list.get(child.parentCategoryId) ?? []), child.alias];

              if (child._count.subCategories > 0) {
                list.set(child.id, parentPath);
              }
              await prisma.category.update({
                where: { id: child.id, isDeleted: false },
                data: {
                  parentCategoryId: isRoot
                    ? (data.parentCategoryId ?? null)
                    : data.parentCategoryId,
                  pathname: parentPath,
                  depth: parentPath.length - 1,
                },
              });
            }),
          );
        }
        if (category._count.subCategories > 0 && data.alias) {
          const categoriesWithParentAlias = await prisma.category.findMany({
            where: {
              id: {
                not: category.id,
              },
              pathname: {
                has: category.alias,
              },
              isDeleted: false,
            },
          });
          await Promise.all(
            categoriesWithParentAlias.map((child) => {
              const childPathname = [...child.pathname];
              childPathname[category.depth] = data.alias;
              return prisma.category.update({
                where: { id: child.id, isDeleted: false },
                data: {
                  pathname: {
                    set: childPathname,
                  },
                },
              });
            }),
          );
        }
        return prisma.category.update({
          where,
          data: {
            ...data,
            pathname:
              categoryPathname.length > 0 ? categoryPathname : undefined,
          },
        });
      });
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
          isDeleted: false,
        },
        data: {
          parentCategoryId: null,
          hidden: true,
        },
      });
    }
    return this.prisma.category.update({
      where,
      data: {
        alias: category.alias + "_deleted_" + Date.now(),
        isDeleted: true,
      },
    });
  }

  async isExist(where: Prisma.CategoryWhereUniqueInput): Promise<boolean> {
    const category = await this.prisma.category.findUnique({
      where,
    });
    return !!category;
  }
}
