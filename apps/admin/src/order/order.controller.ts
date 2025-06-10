import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  UsePipes,
  Patch,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { OrderService } from "./order.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { JwtGuard } from "../guards/jwt.guard";
import { OrdersResponseDto } from "./dto/response.dto";
import { OrderDto } from "./dto/order.dto";
import { AppError, ErrorModel } from "@shared/error-model";
import { ValidationPipe } from "../pipes/validation.pipe";
import { UpdateOrderDto } from "./dto/update-order.dto";

@ApiTags("orders")
@Controller("orders")
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @UseGuards(JwtGuard)
  @UsePipes(ValidationPipe)
  @ApiOperation({ summary: "Create a new order" })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({ status: 201, description: "Order created successfully" })
  @ApiInternalServerErrorResponse({
    description: "Internal server error",
    type: AppError,
    example: ErrorModel.INTERNAL_SERVER_ERROR,
  })
  @ApiBadRequestResponse({
    description: "Bad request, validation failed",
    type: AppError,
  })
  @ApiUnauthorizedResponse({
    description: "Unauthorized",
    type: AppError,
    example: ErrorModel.USER_UNAUTHORIZED,
  })
  @Post()
  create(@Body() data: CreateOrderDto) {
    return this.orderService.create({ data });
  }

  @UseGuards(JwtGuard)
  @ApiOperation({ summary: "Confirm an order" })
  @ApiBody({ schema: { properties: { id: { type: "string" } } } })
  @ApiResponse({ status: 200, description: "Order confirmed" })
  @ApiInternalServerErrorResponse({
    description: "Internal server error",
    type: AppError,
    example: ErrorModel.INTERNAL_SERVER_ERROR,
  })
  @ApiUnauthorizedResponse({
    description: "Unauthorized",
    type: AppError,
    example: ErrorModel.USER_UNAUTHORIZED,
  })
  @Post("confirm")
  confirm(@Body() data: { id: string }) {
    return this.orderService.confirm(data);
  }

  @UseGuards(JwtGuard)
  @ApiOperation({ summary: "Cancel an order" })
  @ApiBody({ schema: { properties: { id: { type: "string" } } } })
  @ApiResponse({ status: 200, description: "Order cancel" })
  @ApiInternalServerErrorResponse({
    description: "Internal server error",
    type: AppError,
    example: ErrorModel.INTERNAL_SERVER_ERROR,
  })
  @ApiUnauthorizedResponse({
    description: "Unauthorized",
    type: AppError,
    example: ErrorModel.USER_UNAUTHORIZED,
  })
  @Post("cancel")
  cancel(@Body() data: { id: string }) {
    return this.orderService.cancel(data);
  }

  @UseGuards(JwtGuard)
  @ApiOperation({ summary: "Get all orders" })
  @ApiResponse({
    status: 200,
    description: "List of orders",
    type: OrdersResponseDto,
  })
  @ApiInternalServerErrorResponse({
    description: "Internal server error",
    type: AppError,
    example: ErrorModel.INTERNAL_SERVER_ERROR,
  })
  @ApiUnauthorizedResponse({
    description: "Unauthorized",
    type: AppError,
    example: ErrorModel.USER_UNAUTHORIZED,
  })
  @Get()
  findAll(
    @Query("skip") skip: number,
    @Query("take") take: number,
  ): Promise<OrdersResponseDto> {
    return this.orderService.findAll({
      skip: skip ? +skip : undefined,
      take: take ? +take : undefined,
    });
  }

  @UseGuards(JwtGuard)
  @ApiOperation({ summary: "Get order by ID" })
  @ApiParam({ name: "id", type: String })
  @ApiResponse({ status: 200, description: "Order details", type: OrderDto })
  @ApiNotFoundResponse({
    description: "Order not found",
    type: AppError,
    example: ErrorModel.ORDER_NOT_FOUND,
  })
  @ApiInternalServerErrorResponse({
    description: "Internal server error",
    type: AppError,
    example: ErrorModel.INTERNAL_SERVER_ERROR,
  })
  @ApiUnauthorizedResponse({
    description: "Unauthorized",
    type: AppError,
    example: ErrorModel.USER_UNAUTHORIZED,
  })
  @Get(":id")
  findOne(@Param("id") id: string): Promise<OrderDto> {
    return this.orderService.findOne({
      where: { id },
    });
  }

  @UseGuards(JwtGuard)
  @ApiOperation({ summary: "Update order by ID" })
  @ApiParam({ name: "id", type: String })
  @ApiResponse({
    status: 200,
    description: "Updated order details",
    type: OrderDto,
  })
  @ApiNotFoundResponse({
    description: "Order not found",
    type: AppError,
    example: ErrorModel.ORDER_NOT_FOUND,
  })
  @ApiInternalServerErrorResponse({
    description: "Internal server error",
    type: AppError,
    example: ErrorModel.INTERNAL_SERVER_ERROR,
  })
  @ApiBadRequestResponse({
    description: "Bad request, validation failed",
    type: AppError,
    example: ErrorModel.ORDER_BODY_UPDATE_ERROR,
  })
  @ApiUnauthorizedResponse({
    description: "Unauthorized",
    type: AppError,
    example: ErrorModel.USER_UNAUTHORIZED,
  })
  @Patch("order/:id")
  update(
    @Param("id") id: string,
    @Body() data: UpdateOrderDto,
  ): Promise<OrderDto> {
    return this.orderService.update({
      where: { id },
      data,
    });
  }
}
