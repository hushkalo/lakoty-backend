import { Module } from "@nestjs/common";
import { CategoriesModule } from "./categories/categories.module";
import { PrismaModule } from "./prisma/prisma.module";
import { ProductsModule } from "./products/products.module";
import { ConfigModule } from "@nestjs/config";
import { ServeStaticModule } from "@nestjs/serve-static";
import { UploadModule } from "./upload/upload.module";
import { join } from "node:path";
import { MAIN_STATIC_DIRECTORY_NAME } from "./constants/constant";
import { StatusModule } from "./status/status.module";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { UserModule } from "./user/user.module";
import { AuthModule } from "./auth/auth.module";
import { CourseModule } from "./course/course.module";

@Module({
  imports: [
    CategoriesModule,
    PrismaModule,
    ProductsModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "..", MAIN_STATIC_DIRECTORY_NAME),
    }),
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
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
