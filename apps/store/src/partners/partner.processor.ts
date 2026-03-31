import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { PartnerService } from "./partner.service";
import { PartnerDto } from "./dto/partner.dto";
import { ProductsService } from "../products/products.service";
import { ProductDto } from "../products/dto/product.dto";

interface UpdateProductChunkJob {
  partner: PartnerDto;
  products: ProductDto[];
  chunkIndex: number;
  totalChunks: number;
}

@Injectable()
@Processor("partner")
export class PartnerProcessor extends WorkerHost {
  constructor(
    private readonly productsService: ProductsService,
    private readonly partnerService: PartnerService,
    private readonly logger: Logger,
  ) {
    super();
  }

  async process(job: Job<UpdateProductChunkJob>): Promise<void> {
    const { partner, products, chunkIndex, totalChunks } = job.data;

    this.logger.log(
      `Processing chunk ${chunkIndex + 1}/${totalChunks} for partner ${partner.name}`,
    );

    const { apiUrl, apiKey } = partner;

    for (const product of products) {
      try {
        const crmProduct = await this.partnerService.findProductFromCrm(
          product.keyCrmId,
          partner,
        );

        const crmDiscountInAmount = crmProduct.custom_fields.find(
          ({ uuid }) => uuid === "CT_1002",
        );

        const discountAmount = crmDiscountInAmount
          ? Number(crmDiscountInAmount.value)
          : 0;

        const discountInPercent = crmDiscountInAmount
          ? Number(((discountAmount / crmProduct.price) * 100).toFixed(2))
          : 0;

        await this.productsService.update(product.id, {
          name: crmProduct.name,
          price: crmProduct.price,
          description: crmProduct.description,
          quantity: crmProduct.quantity,
          discount: discountInPercent,
          hidden: crmProduct.quantity === 0 ? true : crmProduct.is_archived,
        });

        const sizes = await this.partnerService.getProductSizes(
          product.keyCrmId,
          apiUrl,
          apiKey,
        );

        const promises = sizes.map(async (size) => {
          return this.productsService.updateSize(size.keyCrmId, {
            quantity: size.quantity,
            isAvailable: size.quantity === 0 ? false : size.isAvailable,
          });
        });

        await Promise.all(promises);
      } catch (error) {
        console.error(`Error updating product ${product.id}:`, error);
      }
    }

    console.log(`Chunk ${chunkIndex + 1}/${totalChunks} completed`);
  }
}
