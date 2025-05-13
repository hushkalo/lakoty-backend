import { Logger, Module } from "@nestjs/common";
import { OrderService } from "./order.service";
import { OrderController } from "./order.controller";
import { PrismaModule } from "@libs/prisma-client";
import { ProductsModule } from "../products/products.module";

@Module({
  imports: [PrismaModule, ProductsModule],
  controllers: [OrderController],
  providers: [OrderService, Logger],
  exports: [OrderService],
})
export class OrderModule {}
