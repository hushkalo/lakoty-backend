import { Logger, Module } from "@nestjs/common";
import { BrandController } from "./brand.controller";
import { BrandService } from "./brand.service";
import { PrismaModule } from "@libs/prisma-client";
import { RedisModule } from "../redis/redis.module";

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [BrandController],
  providers: [BrandService, Logger],
})
export class BrandModule {}
