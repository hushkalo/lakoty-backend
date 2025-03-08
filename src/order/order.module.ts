import { Logger, Module } from "@nestjs/common";
import { OrderService } from "./order.service";
import { OrderController } from "./order.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { AdminOrderController } from "./admin.order.controller";

@Module({
  imports: [PrismaModule],
  controllers: [OrderController, AdminOrderController],
  providers: [OrderService, Logger],
  exports: [OrderService],
})
export class OrderModule {}
