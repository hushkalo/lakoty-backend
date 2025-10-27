import { Logger, Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { PartnerService } from "./partner.service";
import { PrismaModule } from "@libs/prisma-client";
import { BullModule } from "@nestjs/bullmq";
import { PartnerProcessor } from "./partner.processor";
import { ProductsModule } from "../products/products.module";

@Module({
  imports: [
    PrismaModule,
    HttpModule,
    BullModule.registerQueue({
      name: "partner",
    }),
    ProductsModule,
  ],
  providers: [PartnerService, PartnerProcessor, Logger],
  exports: [PartnerService],
})
export class PartnerModule {}
