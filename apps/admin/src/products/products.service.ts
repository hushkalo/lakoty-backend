import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { UpdateProductDto } from "./dto/update-product.dto";
import { Prisma, Product, User, PrismaService } from "@libs/prisma-client";
import { CreateProductDto } from "./dto/create-product.dto";
import { type ResponseDataType } from "@shared/types";
import { CategoriesService } from "../categories/categories.service";
import { HttpService } from "@nestjs/axios";
import { CreateProductCrmDto } from "./dto/create-product-crm.dto";
import { CrmProductDto } from "./dto/crm-product.dto";
import { CreateProductOffersCrmDto } from "./dto/create-product-offers-crm.dto";
import { CrmProductOffersDto } from "./dto/crm-product-offers.dto";
import { PrismaClientValidationError } from "@prisma/client/runtime/library";
import { ErrorModel } from "@shared/error-model";

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly category: CategoriesService,
    private readonly httpService: HttpService,
    private readonly logger: Logger,
  ) {}
  SERVICE_NAME = ProductsService.name;

  async create(params: {
    data: CreateProductDto;
    user: User;
  }): Promise<Product> {
    const { categoryId, images, productSizes, isCreateOnCrm, ...productData } =
      params.data;
    const isCategoryExist = await this.category.isExist({ id: categoryId });
    if (!isCategoryExist) {
      throw new NotFoundException(ErrorModel.CATEGORY_DOES_NOT_EXIST);
    }
    const isExistAlias = await this.prisma.product.findFirst({
      where: {
        alias: productData.alias,
      },
    });
    if (isExistAlias) {
      throw new BadRequestException(ErrorModel.PRODUCT_ALIAS_ALREADY_EXISTS);
    }
    try {
      const product = await this.prisma.product.create({
        include: {
          images: true,
          productSizes: true,
          category: true,
        },
        data: {
          ...productData,
          category: {
            connect: { id: categoryId },
          },
          images: {
            create: images.map((image) => ({
              url: image.url,
              order: image.order,
            })),
          },
          productSizes: {
            create: productSizes,
          },
        },
      });
      if (isCreateOnCrm) {
        const { crmProduct, crmProductOffers } = await this.createProductInCrm({
          product,
          user: params.user,
        });
        await this.prisma.product.update({
          where: {
            id: product.id,
          },
          data: {
            keyCrmId: crmProduct.id,
            productSizes: {
              updateMany: crmProductOffers.map((offer) => ({
                data: {
                  keyCrmId: offer.id,
                },
                where: {
                  sku: offer.sku,
                },
              })),
            },
          },
        });
      }

      return product;
    } catch (error) {
      if (error instanceof PrismaClientValidationError) {
        const match = error.message.match(/Unknown argument `([^`]+)`/);
        const result = match ? match[1] : null;
        this.logger.error(error.name, error.stack, this.SERVICE_NAME);
        throw new BadRequestException(
          ErrorModel.PRODUCT_CREATE_INCORRECT_BODY(result),
        );
      }
      if (error instanceof Error) {
        this.logger.error(error.name, error, this.SERVICE_NAME);
        throw new BadRequestException(ErrorModel.PRODUCT_CREATE_FAILED);
      }
      this.logger.error(error.name, error, this.SERVICE_NAME);
      throw error;
    }
  }

  private async createProductInCrm(params: {
    product: Prisma.ProductGetPayload<{
      include: {
        images: true;
        productSizes: true;
        category: true;
      };
    }>;
    user: User;
  }): Promise<{
    crmProduct: CrmProductDto;
    crmProductOffers: CrmProductOffersDto[];
  }> {
    try {
      const bodyProductCrm: CreateProductCrmDto = {
        name: params.product.name,
        sku: params.product.sku,
        category_id: params.product.category.keyCrmId,
        description: params.product.description,
        price: params.product.price,
        pictures: params.product.images.map((image) => image.url),
        currency_code: "UAH",
        weight: 0,
        width: 0,
        height: 0,
        length: 0,
        custom_fields: [
          {
            uuid: "CT_1001",
            value: params.product.name,
          },
        ],
      };
      const crmProduct = await this.httpService.axiosRef.post<CrmProductDto>(
        "/products",
        bodyProductCrm,
      );
      this.logger.log(
        `Created product in CRM with ID ${crmProduct.data.id} by user email: ${params.user.email}`,
        this.SERVICE_NAME,
      );
      if (params.product.productSizes.length === 0) {
        return {
          crmProduct: crmProduct.data,
          crmProductOffers: [],
        };
      }
      const firstImageUrl =
        params.product.images.length > 0 ? params.product.images[0].url : ""; // TODO: fix that
      const bodyProductOffers: CreateProductOffersCrmDto = {
        offers: params.product.productSizes.map((size) => ({
          sku: size.sku,
          price: params.product.price,
          weight: 0,
          height: 0,
          image_url: firstImageUrl,
          length: 0,
          width: 0,
          properties: [
            {
              name: "Розмір",
              value: size.name,
            },
          ],
        })),
      };
      await this.httpService.axiosRef.post<{
        status: boolean;
      }>(`/products/${crmProduct.data.id}/offers`, bodyProductOffers);
      const { data: crmProductOffers } = await this.httpService.axiosRef.get<{
        data: CrmProductOffersDto[];
      }>(`/offers?filter[product_id]=${crmProduct.data.id}`);
      crmProductOffers.data.forEach((offer) => {
        this.logger.log(
          `Created product's offers in CRM with ID ${offer.id} by user email: ${params.user.email}`,
          this.SERVICE_NAME,
        );
      });
      return {
        crmProduct: crmProduct.data,
        crmProductOffers: crmProductOffers.data,
      };
    } catch (error) {
      await this.remove({
        where: {
          id: params.product.id,
        },
        user: params.user,
      });

      this.logger.error(error.message, error, this.SERVICE_NAME);
      throw new BadRequestException(
        ErrorModel.PRODUCT_CREATE_FAILED_WITH_PROBLEM_CRM,
      );
    }
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.ProductWhereInput;
    orderBy?: Prisma.ProductOrderByWithRelationInput[];
    include?: Prisma.ProductInclude;
    omit?: Prisma.ProductOmit;
  }): Promise<ResponseDataType<Product[]>> {
    const { omit, include, take, skip, orderBy, ...restParams } = params;
    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        ...params,
        take,
        skip,
        orderBy,
        include,
        omit,
      }),
      this.prisma.product.count(restParams),
    ]);
    return {
      data: products,
      total,
      to: products.length,
    };
  }

  async getRecommendedProducts(params: {
    where: Prisma.ProductWhereInput;
    take: number;
    include?: Prisma.ProductInclude;
    omit?: Prisma.ProductOmit;
    orderBy?: Prisma.ProductOrderByWithRelationInput;
  }): Promise<Product[]> {
    const countProductCategory = await this.prisma.product.count({
      where: params.where,
    });
    return this.prisma.product.findMany({
      ...params,
      skip:
        countProductCategory < 7
          ? 0
          : Math.floor(Math.random() * countProductCategory),
    });
  }

  findOne(params: {
    where: Prisma.ProductWhereUniqueInput;
    omit?: Prisma.ProductOmit;
    include?: Prisma.ProductInclude;
  }): Promise<Product> {
    return this.prisma.product.findUnique(params);
  }

  async update(params: {
    where: Prisma.ProductWhereUniqueInput;
    data: UpdateProductDto;
  }): Promise<Product> {
    const { where, data } = params;
    const { categoryId, images, productSizes, ...productData } = data;
    const isCategoryExist = await this.category.isExist({ id: categoryId });
    if (!isCategoryExist) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }
    return this.prisma.product.update({
      data: {
        ...productData,
        category: {
          connect: { id: categoryId },
        },
        images: {
          deleteMany: {
            productId: where.id,
            id: {
              notIn: images.map((image) => image.id).filter((size) => size),
            },
          },
          upsert: images.map((image) => ({
            where: { id: image.id || "" },
            update: { url: image.url },
            create: {
              url: image.url,
              order: image.order,
            },
          })),
        },
        productSizes: {
          deleteMany: {
            productId: where.id,
            id: {
              notIn: productSizes.map((size) => size.id).filter((size) => size),
            },
          },
          upsert: productSizes.map((size) => ({
            where: {
              id: size.id || "",
            },
            update: size,
            create: size,
          })),
        },
      },
      where,
      include: {
        images: true,
        productSizes: true,
      },
    });
  }

  async remove(params: {
    where: Prisma.ProductWhereUniqueInput;
    user: User;
  }): Promise<Product> {
    const { where, user } = params;
    const product = await this.prisma.product.findUnique({
      where,
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${where.id} not found`);
    }
    this.logger.verbose(
      `Product ${where.id} removed by user email: ${user.email} `,
      this.SERVICE_NAME,
    );
    return this.prisma.product.delete({
      where,
    });
  }
}
