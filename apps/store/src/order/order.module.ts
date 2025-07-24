import { Logger, Module } from "@nestjs/common";
import { OrderService } from "./order.service";
import { OrderController } from "./order.controller";
import { PrismaModule } from "@libs/prisma-client";
import { ProductsModule } from "../products/products.module";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";
import { BasketModule } from "../basket/basket.module";
import { RedisModule } from "../redis/redis.module";

@Module({
  imports: [
    PrismaModule,
    ProductsModule,
    ConfigModule,
    HttpModule,
    BasketModule,
    RedisModule,
  ],
  controllers: [OrderController],
  providers: [OrderService, Logger],
  exports: [OrderService],
})
export class OrderModule {}
