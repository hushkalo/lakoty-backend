import { Module } from "@nestjs/common";
import { ProductsService } from "./products.service";
import { ProductsController } from "./products.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { CategoriesModule } from "../categories/categories.module";
import { AdminProductsController } from "./admin-products.controller";

@Module({
  imports: [PrismaModule, CategoriesModule],
  controllers: [ProductsController, AdminProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
