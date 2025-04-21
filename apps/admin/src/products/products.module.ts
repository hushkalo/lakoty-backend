import { Logger, Module } from "@nestjs/common";
import { ProductsService } from "./products.service";
import { ProductsController } from "./products.controller";
import { PrismaModule } from "@libs/prisma-client";
import { CategoriesModule } from "../categories/categories.module";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { EnvironmentVariablesForAdmin } from "@shared/configuration";

@Module({
  imports: [
    PrismaModule,
    CategoriesModule,
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (
        configService: ConfigService<EnvironmentVariablesForAdmin>,
      ) => ({
        baseURL: configService.get("CRM_API_URL"),
        headers: {
          Authorization: `Bearer ${configService.get("CRM_API_KEY")}`,
        },
      }),
    }),
  ],
  controllers: [ProductsController],
  providers: [ProductsService, Logger],
  exports: [ProductsService],
})
export class ProductsModule {}
