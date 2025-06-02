import {
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { UpdateProductDto } from "./dto/update-product.dto";
import { Prisma, Product, User, PrismaService } from "@libs/prisma-client";
import { CreateProductDto } from "./dto/create-product.dto";
import { CategoriesService } from "../categories/categories.service";
import { HttpService } from "@nestjs/axios";
import { CreateProductCrmDto } from "./dto/create-product-crm.dto";
import { CrmProductDto } from "./dto/crm-product.dto";
import { CreateProductOffersCrmDto } from "./dto/create-product-offers-crm.dto";
import { CrmProductOffersDto } from "./dto/crm-product-offers.dto";
import { ErrorModel } from "@shared/error-model";
import { AllProductsResponseDto } from "./dto/response.dto";
import { ProductDto } from "./dto/product.dto";

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categoryService: CategoriesService,
    private readonly httpService: HttpService,
    private readonly logger: Logger,
  ) {}
  SERVICE_NAME = ProductsService.name;

  async create(params: {
    data: CreateProductDto;
    user: User;
  }): Promise<
    Omit<ProductDto, "_count" | "category" | "images" | "productSizes">
  > {
    const { categoryId, images, productSizes, isCreateOnCrm, ...productData } =
      params.data;
    const isCategoryExist = await this.categoryService.isExist({
      id: categoryId,
    });
    if (!isCategoryExist) {
      throw new NotFoundException(ErrorModel.CATEGORY_DOES_NOT_EXIST);
    }
    const isExistAlias = await this.prisma.product.findFirst({
      where: {
        alias: productData.alias,
      },
    });
    if (isExistAlias) {
      throw new ConflictException(ErrorModel.PRODUCT_ALIAS_ALREADY_EXISTS);
    }
    try {
      return await this.prisma.$transaction(async (prisma) => {
        const product = await prisma.product.create({
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
          const { crmProduct, crmProductOffers } =
            await this.createProductInCrm({
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
      });
    } catch (error) {
      this.logger.error(error.name, error, this.SERVICE_NAME);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(ErrorModel.INTERNAL_SERVER_ERROR);
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
      this.logger.error(error.message, error, this.SERVICE_NAME);
      throw new InternalServerErrorException(
        ErrorModel.PRODUCT_CREATE_FAILED_WITH_PROBLEM_CRM,
      );
    }
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.ProductWhereInput;
    orderBy?: Prisma.ProductOrderByWithRelationInput[];
  }): Promise<AllProductsResponseDto> {
    const { take, skip, orderBy, ...restParams } = params;
    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        ...params,
        take,
        skip,
        orderBy,
        include: {
          images: true,
          productSizes: true,
          category: true,
          _count: true,
        },
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
  }): Promise<ProductDto> {
    return this.prisma.product.findUnique({
      where: params.where,
      include: {
        images: true,
        productSizes: true,
        category: true,
        _count: true,
      },
    });
  }

  async update(params: {
    where: Prisma.ProductWhereUniqueInput;
    data: Partial<UpdateProductDto>;
  }): Promise<ProductDto> {
    const isCategoryExist = await this.categoryService.isExist({
      id: params.data.categoryId || "",
    });
    if (!isCategoryExist && params.data.categoryId) {
      throw new NotFoundException(
        ErrorModel.CATEGORY_NOT_FOUND(params.data.categoryId, "ID"),
      );
    }
    try {
      return this.prisma.$transaction(async (prisma) => {
        const { images, productSizes, ...productData } = params.data;
        if (images) {
          await prisma.product.update({
            where: params.where,
            data: {
              images: {
                deleteMany: {
                  productId: params.where.id,
                  id: {
                    notIn: images
                      .map((image) => image.id)
                      .filter((size) => size),
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
            },
          });
        }
        if (productSizes) {
          await prisma.product.update({
            where: params.where,
            data: {
              productSizes: {
                deleteMany: {
                  productId: params.where.id,
                  id: {
                    notIn: productSizes
                      .map((size) => size.id)
                      .filter((size) => size),
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
          });
        }
        return prisma.product.update({
          data: productData,
          where: params.where,
          include: {
            images: true,
            productSizes: true,
            category: true,
            _count: true,
          },
        });
      });
    } catch (error) {
      this.logger.error(this.SERVICE_NAME, error.name, error);
      throw new InternalServerErrorException(ErrorModel.INTERNAL_SERVER_ERROR);
    }
  }

  async getProductFromCrm(params: { id: number }): Promise<CrmProductDto> {
    try {
      const { data } = await this.httpService.axiosRef.get<CrmProductDto>(
        `/products/${params.id}`,
      );
      return data;
    } catch (error) {
      this.logger.error(
        `Failed to fetch product from CRM with ID ${params.id}`,
        error,
        this.SERVICE_NAME,
      );
      if (error.response?.status === 404) {
        throw new NotFoundException(ErrorModel.PRODUCT_NOT_FOUND_IN_CRM);
      }
      throw new InternalServerErrorException(ErrorModel.INTERNAL_SERVER_ERROR);
    }
  }

  async remove(params: {
    where: Prisma.ProductWhereUniqueInput;
    user: User;
  }): Promise<ProductDto> {
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
      include: {
        images: true,
        productSizes: true,
        category: true,
        _count: true,
      },
    });
  }
}
