import { Logger, Module } from "@nestjs/common";
import { CategoriesController } from "./categories.controller";
import { CategoriesService } from "./categories.service";
import { PrismaModule } from "@libs/prisma-client";
import { RedisModule } from "../redis/redis.module";

@Module({
  imports: [PrismaModule, RedisModule],

  controllers: [CategoriesController],
  providers: [CategoriesService, Logger],
  exports: [CategoriesService],
})
export class CategoriesModule {}
