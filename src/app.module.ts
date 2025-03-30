import { Module } from "@nestjs/common";
import { CategoriesModule } from "./categories/categories.module";
import { PrismaModule } from "./prisma/prisma.module";
import { ProductsModule } from "./products/products.module";
import { ConfigModule } from "@nestjs/config";
import { UploadModule } from "./upload/upload.module";
import { StatusModule } from "./status/status.module";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { UserModule } from "./user/user.module";
import { AuthModule } from "./auth/auth.module";
import { CourseModule } from "./course/course.module";
import { OrderModule } from "./order/order.module";
import { validate } from "./config/env.validation";
import { configuration } from "./config/configuration";
import { NovaPostModule } from "./nova-post/nova-post.module";

@Module({
  imports: [
    CategoriesModule,
    PrismaModule,
    ProductsModule,
    ConfigModule.forRoot({
      envFilePath: `.env.${process.env.NODE_ENV ?? "development"}`,
      load: [configuration],
      expandVariables: true,
      validate,
    }),
    UploadModule,
    StatusModule,
    UserModule,
    AuthModule,
    CourseModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 1000,
      },
    ]),
    OrderModule,
    NovaPostModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
