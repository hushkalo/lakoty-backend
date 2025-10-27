import { Module } from "@nestjs/common";
import { CategoriesModule } from "./categories/categories.module";
import { PrismaModule } from "@libs/prisma-client";
import { ProductsModule } from "./products/products.module";
import { ConfigModule } from "@nestjs/config";
import { UploadModule } from "./upload/upload.module";
import { StatusModule } from "./status/status.module";
import { UserModule } from "./user/user.module";
import { AuthModule } from "./auth/auth.module";
import { validate, configuration } from "@shared/configuration";
import { NovaPostModule } from "./nova-post/nova-post.module";
import { PartnerModule } from "./partners/partner.module";

@Module({
  imports: [
    CategoriesModule,
    PrismaModule,
    ProductsModule,
    ConfigModule.forRoot({
      envFilePath: `apps/admin/.env.${process.env.NODE_ENV ?? "development"}`,
      load: [configuration],
      expandVariables: true,
      validate,
    }),
    UploadModule,
    StatusModule,
    UserModule,
    AuthModule,
    NovaPostModule,
    PartnerModule,
  ],
  providers: [],
})
export class AppModule {}
