import { Injectable } from "@nestjs/common";
import { PrismaService, Prisma } from "@libs/prisma-client";
import { CreatePartnerDto } from "./dto/create-partner.dto";
import { UpdatePartnerDto } from "./dto/update-partner.dto";
import { PartnerDto } from "./dto/partner.dto";
import { UploadProductsResponseDto } from "./dto/upload-products-response.dto";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { transliteration } from "../utils/transliteration.util";
import {
  TProduct,
  TResponse,
  TOffer,
  TSize,
  TCategory,
} from "./dto/partner-api.dto";
import { HttpException, HttpStatus } from "@nestjs/common";

@Injectable()
export class PartnerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {}

  async create(data: CreatePartnerDto): Promise<PartnerDto> {
    return this.prisma.partners.create({ data });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.PartnersWhereInput;
    orderBy?: Prisma.PartnersOrderByWithRelationInput;
    omit?: Prisma.PartnersOmit;
    include?: Prisma.PartnersInclude;
  }) {
    const { omit, include, ...restParams } = params;
    const [partners, total] = await this.prisma.$transaction([
      this.prisma.partners.findMany({
        ...params,
        omit,
        include,
      }),
      this.prisma.partners.count({
        ...restParams,
      }),
    ]);
    return {
      data: partners,
      total,
      to: partners.length,
    };
  }

  findOne(params: {
    where: Prisma.PartnersWhereUniqueInput;
    include?: Prisma.PartnersInclude;
    omit?: Prisma.PartnersOmit;
    select?: Prisma.PartnersSelect;
  }): Promise<PartnerDto> {
    return this.prisma.partners.findUnique(params);
  }

  async update(params: {
    where: Prisma.PartnersWhereUniqueInput;
    data: UpdatePartnerDto;
  }) {
    return this.prisma.partners.update({
      where: params.where,
      data: params.data,
    });
  }

  remove(params: { where: Prisma.PartnersWhereUniqueInput }) {
    return this.prisma.partners.delete(params);
  }

  async uploadPartnerProducts(
    partnerId: string,
  ): Promise<UploadProductsResponseDto> {
    const partner = await this.prisma.partners.findUnique({
      where: { id: partnerId },
    });

    if (!partner) {
      throw new Error(`Partner with id ${partnerId} not found`);
    }

    const { apiUrl, apiKey } = partner;

    const products: TProduct[] = [];
    let totalCount = 0;
    const perPage = 50;
    let countCycles = 0;

    const responseCategories = await firstValueFrom(
      this.httpService.get<TResponse<TCategory>>(
        `${apiUrl}/products/categories/?limit=${perPage}&page=${countCycles + 1}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          timeout: 30000,
        },
      ),
    );

    do {
      try {
        const response = await firstValueFrom(
          this.httpService.get<TResponse<TProduct>>(
            `${apiUrl}/products/?limit=${perPage}&page=${countCycles + 1}`,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
              },
              timeout: 30000, // 30 seconds timeout
            },
          ),
        );

        const result = response.data;

        if (products.length === 0 && totalCount === 0) {
          totalCount = result.total;
        }

        totalCount -= perPage;
        countCycles += 1;
        products.push(...result.data);
      } catch (error) {
        if (error.response?.status === 429) {
          throw new HttpException(
            {
              message:
                "Rate limit exceeded. Too many requests to partner API. Please try again later.",
              error: "Too Many Requests",
              partnerId: partnerId,
              partnerName: partner.name,
            },
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
        if (
          error.code === "ECONNABORTED" ||
          error.message?.includes("timeout")
        ) {
          throw new HttpException(
            {
              message: "Request timeout. Partner API took too long to respond.",
              error: "Request Timeout",
              partnerId: partnerId,
              partnerName: partner.name,
            },
            HttpStatus.REQUEST_TIMEOUT,
          );
        }
        throw error;
      }
    } while (totalCount > 0);

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const product of products) {
      if (product.is_archived || product.category_id === 45) {
        skippedCount++;
        continue;
      }
      const keyCrmCategory = responseCategories.data.data.find(
        (category) => category.id === product.category_id,
      );

      const category = await this.prisma.category.findFirst({
        where: {
          name: keyCrmCategory.name,
        },
      });

      if (!category) {
        skippedCount++;
        continue;
      }

      const productExist = await this.prisma.product.findFirst({
        where: {
          keyCrmId: product.id,
          partnersId: partnerId,
        },
      });

      if (productExist) {
        await this.prisma.product.update({
          where: { id: productExist.id },
          data: {
            description: product.description,
            price: product.max_price,
            quantity: product.quantity,
            updatedAt: new Date(product.updated_at),
            sku: product.sku,
            hidden: product.is_archived,
          },
        });
        updatedCount++;
        continue;
      }

      const sizes = await this.getProductSizes(product.id, apiUrl, apiKey);

      await this.prisma.product.create({
        data: {
          name: product.name,
          description: product.description,
          price: product.max_price,
          alias: transliteration(product.name),
          quantity: product.quantity,
          createdAt: new Date(product.created_at),
          updatedAt: new Date(product.updated_at),
          sku: product.sku,
          hidden: product.is_archived,
          keyCrmId: product.id,
          discount: 0,
          category: {
            connect: {
              id: category.id,
            },
          },
          Partner: {
            connect: {
              id: partnerId,
            },
          },
          images: {
            create: product.attachments_data.map((attachment, index) => ({
              url: attachment,
              order: index,
            })),
          },
          productSizes: {
            create: sizes,
          },
        },
      });

      createdCount++;
    }

    return {
      success: true,
      total: products.length,
      created: createdCount,
      updated: updatedCount,
      skipped: skippedCount,
      message: `Successfully synced ${createdCount} new and ${updatedCount} updated products from partner ${partner.name}`,
    };
  }

  private async getProductSizes(
    productId: number,
    apiUrl: string,
    apiKey: string,
  ): Promise<TSize[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<TResponse<TOffer>>(
          `${apiUrl}/offers?filter[product_id]=${productId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            timeout: 15000, // 15 seconds timeout
          },
        ),
      );

      const offers = response.data;

      return offers.data
        .map((offer) => ({
          keyCrmId: offer.id,
          name:
            offer?.properties.length <= 0
              ? "default"
              : offer.properties[0].value,
          quantity: offer.quantity,
          isAvailable: true,
          sku: offer.sku,
        }))
        .filter((size) => size.name !== "default");
    } catch (error) {
      if (error.response?.status === 429) {
        throw new HttpException(
          {
            message:
              "Rate limit exceeded while fetching product sizes. Too many requests to partner API.",
            error: "Too Many Requests",
            productId: productId,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
        console.warn(
          `Timeout fetching sizes for product ${productId}, skipping sizes`,
        );
        return [];
      }
      // Return empty array on other errors to not block product creation
      return [];
    }
  }
}
