import { Injectable, Logger } from "@nestjs/common";
import { PrismaService, Prisma } from "@libs/prisma-client";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { TProduct, TResponse, TOffer, TSize } from "./dto/partner-api.dto";
import { HttpException, HttpStatus } from "@nestjs/common";
import { Queue } from "bullmq";
import { InjectQueue } from "@nestjs/bullmq";
import { PartnerDto } from "./dto/partner.dto";

@Injectable()
export class PartnerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly logger: Logger,
    @InjectQueue("partner") private partnerQueue: Queue,
  ) {}

  async findAll(params: { where?: Prisma.PartnersWhereInput }) {
    return this.prisma.partners.findMany(params);
  }

  async uploadPartnerProducts(partnerId: string) {
    const partner = await this.prisma.partners.findUnique({
      where: { id: partnerId },
      include: {
        Product: true,
      },
    });

    if (!partner) {
      throw new Error(`Partner with id ${partnerId} not found`);
    }

    const totalProducts = partner.Product.length;
    this.logger.debug(
      `Total products for partner ${partner.name}: ${totalProducts}`,
    );

    const chunkSize = 30;
    const totalChunks = Math.ceil(totalProducts / chunkSize);

    this.logger.debug(
      `Will process ${totalChunks} chunks of ${chunkSize} products each`,
    );

    for (let i = 0; i < partner.Product.length; i += chunkSize) {
      const chunk = partner.Product.slice(i, i + chunkSize);
      const chunkIndex = Math.floor(i / chunkSize);

      await this.partnerQueue.add(
        "updatePartnerProductQuantity",
        {
          partner,
          products: chunk,
          chunkIndex: chunkIndex,
          totalChunks: totalChunks,
        },
        {
          delay: chunkIndex * 60000,
        },
      );
    }

    return {
      success: true,
      message: `Queued ${totalChunks} chunks for processing. Total products: ${totalProducts}`,
      totalProducts: totalProducts,
      totalChunks: totalChunks,
      estimatedTime: `${totalChunks} minutes`,
    };
  }

  async getProductSizes(
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

  async findProductFromCrm(productId: number, partner: PartnerDto) {
    const { apiUrl, apiKey } = partner;

    const response = await firstValueFrom(
      this.httpService.get<TProduct>(`${apiUrl}/products/${productId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      }),
    );

    return response.data;
  }
}
