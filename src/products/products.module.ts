import { Logger, Module } from "@nestjs/common";
import { ProductsService } from "./products.service";
import { ProductsController } from "./products.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { CategoriesModule } from "../categories/categories.module";
import { AdminProductsController } from "./admin-products.controller";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { EnvironmentVariables } from "../config/env.validation";

@Module({
  imports: [
    PrismaModule,
    CategoriesModule,
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvironmentVariables>) => ({
        baseURL: configService.get("CRM_API_URL"),
        headers: {
          Authorization: `Bearer ${configService.get("CRM_API_KEY")}`,
        },
      }),
    }),
  ],
  controllers: [ProductsController, AdminProductsController],
  providers: [ProductsService, Logger],
  exports: [ProductsService],
})
export class ProductsModule {}
