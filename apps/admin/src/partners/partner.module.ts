import { Module } from "@nestjs/common";
import { PartnerService } from "./partner.service";
import { PartnerController } from "./partner.controller";
import { PrismaModule } from "@libs/prisma-client";
import { HttpModule } from "@nestjs/axios";

@Module({
  imports: [PrismaModule, HttpModule],
  providers: [PartnerService],
  controllers: [PartnerController],
  exports: [PartnerService],
})
export class PartnerModule {}
