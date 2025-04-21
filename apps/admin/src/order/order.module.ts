import { Logger, Module } from "@nestjs/common";
import { OrderService } from "./order.service";
import { OrderController } from "./order.controller";
import { PrismaModule } from "@libs/prisma-client";

@Module({
  imports: [PrismaModule],
  controllers: [OrderController],
  providers: [OrderService, Logger],
  exports: [OrderService],
})
export class OrderModule {}
