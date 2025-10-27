import { Module } from "@nestjs/common";
import { BrandModule } from "./brands/brand.module";
import { CategoriesModule } from "./categories/categories.module";
import { PrismaModule } from "@libs/prisma-client";
import { ProductsModule } from "./products/products.module";
import { ConfigModule } from "@nestjs/config";
import { validate, configuration } from "@shared/configuration";
import { OrderModule } from "./order/order.module";
import { NovaPostModule } from "./nova-post/nova-post.module";
import { CourseModule } from "./course/course.module";
import { RedisModule } from "./redis/redis.module";
import { ScheduleModule } from "@nestjs/schedule";
import { TasksModule } from "./task/task.module";
import { BasketModule } from "./basket/basket.module";
import { PartnerModule } from "./partners/partner.module";
import { BullModule } from "@nestjs/bullmq";

@Module({
  imports: [
    CategoriesModule,
    PrismaModule,
    ProductsModule,
    OrderModule,
    NovaPostModule,
    CourseModule,
    ConfigModule.forRoot({
      envFilePath: `apps/store/.env.${process.env.NODE_ENV ?? "development"}`,
      load: [configuration],
      expandVariables: true,
      validate,
    }),
    RedisModule.forRoot(),
    ScheduleModule.forRoot(),
    TasksModule,
    BasketModule,
    BrandModule,
    PartnerModule,
    BullModule.forRoot({
      connection: {
        host: "localhost",
        port: 6379,
      },
    }),
  ],
  providers: [],
})
export class AppModule {}
