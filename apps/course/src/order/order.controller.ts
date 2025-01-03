import { Controller, Post, Body } from "@nestjs/common";
import { OrderService } from "./order.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { Throttle } from "@nestjs/throttler";
import { HALF_HOUR_IN_MILLISECONDS } from "@shared/constants";

@Controller("order")
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Throttle({ default: { limit: 3, ttl: HALF_HOUR_IN_MILLISECONDS } })
  @Post("create")
  createOrder(@Body() data: CreateOrderDto) {
    return this.orderService.create(data);
  }
}
