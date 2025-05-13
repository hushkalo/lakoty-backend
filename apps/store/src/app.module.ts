import { Module } from "@nestjs/common";
import { CategoriesModule } from "./categories/categories.module";
import { PrismaModule } from "@libs/prisma-client";
import { ProductsModule } from "./products/products.module";
import { ConfigModule } from "@nestjs/config";
import { validate } from "@shared/configuration";
import { configuration } from "./config/configuration";
import { OrderModule } from "./order/order.module";
import { NovaPostModule } from "./nova-post/nova-post.module";

@Module({
  imports: [
    CategoriesModule,
    PrismaModule,
    ProductsModule,
    OrderModule,
    NovaPostModule,
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
