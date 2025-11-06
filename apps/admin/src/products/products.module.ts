import { Logger, Module } from "@nestjs/common";
import { ProductsService } from "./products.service";
import { ProductsController } from "./products.controller";
import { PrismaModule } from "@libs/prisma-client";
import { CategoriesModule } from "../categories/categories.module";
import { HttpModule } from "@nestjs/axios";

@Module({
  imports: [PrismaModule, CategoriesModule, HttpModule],
  controllers: [ProductsController],
  providers: [ProductsService, Logger],
  exports: [ProductsService],
})
export class ProductsModule {}
