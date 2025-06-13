import { Logger, Module } from "@nestjs/common";
import { OrderService } from "./order.service";
import { OrderController } from "./order.controller";
import { PrismaModule } from "@libs/prisma-client";
import { ProductsModule } from "../products/products.module";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [PrismaModule, ProductsModule, ConfigModule, HttpModule],
  controllers: [OrderController],
  providers: [OrderService, Logger],
  exports: [OrderService],
})
export class OrderModule {}
