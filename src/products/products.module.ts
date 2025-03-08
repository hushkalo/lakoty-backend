import { Logger, Module } from "@nestjs/common";
import { ProductsService } from "./products.service";
import { ProductsController } from "./products.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { CategoriesModule } from "../categories/categories.module";
import { AdminProductsController } from "./admin-products.controller";
import { HttpModule } from "@nestjs/axios";
import { CRM_API_KEY, CRM_API_URL } from "../configuration";

@Module({
  imports: [
    PrismaModule,
    CategoriesModule,
    HttpModule.register({
      baseURL: CRM_API_URL,
      headers: { Authorization: `Bearer ${CRM_API_KEY}` },
    }),
  ],
  controllers: [ProductsController, AdminProductsController],
  providers: [ProductsService, Logger],
  exports: [ProductsService],
})
export class ProductsModule {}
