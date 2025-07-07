import { Module } from "@nestjs/common";
import { ProductsService } from "./products.service";
import { ProductsController } from "./products.controller";
import { PrismaModule } from "@libs/prisma-client";
import { CategoriesModule } from "../categories/categories.module";
import { RedisModule } from "../redis/redis.module";

@Module({
  imports: [PrismaModule, CategoriesModule, RedisModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
