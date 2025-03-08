import { Controller, Post, Body } from "@nestjs/common";
import { OrderService } from "./order.service";
import { Order, Prisma } from "@prisma/client";
import { CreateOrderDto } from "./dto/create-order.dto";

@Controller("orders")
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  create(@Body() createOrderDto: Prisma.OrderCreateInput & CreateOrderDto) {
    return this.orderService.create({ data: createOrderDto });
  }
}
