import {
  Controller,
  Get,
  Post,
  Body,
  Param,
} from "@nestjs/common";
import { OrderService } from "./order.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { Prisma, Order as OrderModel } from "@prisma/client";
import { ResponseDataType } from "../type/response-data.type";

@Controller("admin/orders")
export class AdminOrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  create(@Body() createOrderDto: Prisma.OrderCreateInput & CreateOrderDto) {
    return this.orderService.create({ data: createOrderDto });
  }

  @Get()
  findAll(): Promise<ResponseDataType<OrderModel[]>> {
    return this.orderService.findAll({
      include: {
        Status: {
          select: { name: true },
        },
      },
    });
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.orderService.findOne({
      where: { id },
      include: {
        OrderProduct: {
          include: {
            Product: true,
            ProductSize: true,
          },
        },
      },
    });
  }
}
