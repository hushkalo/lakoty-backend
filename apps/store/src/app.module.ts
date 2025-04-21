import { Module } from "@nestjs/common";
import { CategoriesModule } from "./categories/categories.module";
import { PrismaModule } from "@libs/prisma-client";
import { ProductsModule } from "./products/products.module";
import { ConfigModule } from "@nestjs/config";
import { validate } from "@shared/configuration";
import { configuration } from "./config/configuration";

@Module({
  imports: [
    CategoriesModule,
    PrismaModule,
    ProductsModule,
    ConfigModule.forRoot({
      envFilePath: `apps/store/.env.${process.env.NODE_ENV ?? "development"}`,
      load: [configuration],
      expandVariables: true,
      validate,
    }),
  ],
  providers: [],
})
export class AppModule {}
