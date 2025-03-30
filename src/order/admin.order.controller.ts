import { Controller, Get, Post, Body, Param, UseGuards } from "@nestjs/common";
import { OrderService } from "./order.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { Prisma, Order as OrderModel } from "@prisma/client";
import { ResponseDataType } from "../type/response-data.type";
import { JwtGuard } from "../guards/jwt.guard";

@Controller("admin/orders")
export class AdminOrderController {
  constructor(private readonly orderService: OrderService) {}

  @UseGuards(JwtGuard)
  @Post()
  create(@Body() createOrderDto: Prisma.OrderCreateInput & CreateOrderDto) {
    return this.orderService.create({ data: createOrderDto });
  }
  @UseGuards(JwtGuard)
  @Post("confirm")
  confirm(@Body() data: { id: string }) {
    return this.orderService.confirm(data);
  }

  @UseGuards(JwtGuard)
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

  @UseGuards(JwtGuard)
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.orderService.findOne({
      where: { id },
      include: {
        Status: true,
        OrderProduct: {
          include: {
            Product: {
              include: {
                images: true,
              },
            },
            ProductSize: true,
          },
        },
      },
    });
  }
}
