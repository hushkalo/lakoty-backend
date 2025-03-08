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
import { AdminOrderController } from "./order/admin.order.controller";
import { ProductsController } from "./products/products.controller";
import { StatusController } from "./status/status.controller";
import { UploadController } from "./upload/upload.controller";
import { AdminUserController } from "./user/admin.user.controller";
import { CourseController } from "./course/course.controller";
import { CategoriesController } from "./categories/categories.controller";
import { AdminAuthController } from "./auth/admin.auth.controller";
import { AdminCategoriesController } from "./categories/admin-categories.controller";

@Module({
  imports: [
    CategoriesModule,
    PrismaModule,
    ProductsModule,
    ConfigModule.forRoot({
      envFilePath: `.env.${process.env.NODE_ENV}`,
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
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
