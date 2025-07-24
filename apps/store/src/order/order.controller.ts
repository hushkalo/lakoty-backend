import {
  Controller,
  Post,
  Body,
  UsePipes,
  Param,
  Get,
  Query,
} from "@nestjs/common";
import { OrderService } from "./order.service";
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import {
  CreateOrderResponseDto,
  MyOrdersDto,
  OrderResponseDto,
  RetryOrderResponseDto,
} from "./dto/responses.dto";
import { OrderValidationPipe } from "../pipes/order-validation.pipe";
import { AppError, ErrorModel } from "@shared/error-model";
import { CreateOrderDto } from "./dto/create-order.dto";
import { OrderCallbackCreateDto } from "./dto/order.callback.dto";
import { CallbackRequestBodyDto } from "./dto/callback.dto";

@ApiTags("Orders")
@Controller("orders")
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @ApiOperation({ summary: "Create new order" })
  @ApiResponse({
    status: 201,
    description: "The order has been successfully created.",
    type: CreateOrderResponseDto,
  })
  @ApiBadRequestResponse({
    description: "Not found product by id",
    type: AppError,
    examples: {
      productNotFound: {
        summary: "Product not found",
        value: ErrorModel.PRODUCT_DOES_NOT_EXIST,
      },
      productSizeNotFound: {
        summary: "Product size not found",
        value: ErrorModel.PRODUCT_SIZE_NOT_FOUND,
      },
      bodyBadRequest: {
        summary: "Body bad request",
        value: {
          firstName: [
            "firstName should not be empty",
            "firstName must be a string",
          ],
          secondName: [
            "secondName should not be empty",
            "secondName must be a string",
          ],
          patronymic: [
            "patronymic should not be empty",
            "patronymic must be a string",
          ],
          phoneNumber: [
            "Phone number must be in format +380XXXXXXXXX",
            "phoneNumber must be a string",
          ],
          city: ["city should not be empty", "city must be a string"],
          warehouseAddress: [
            "warehouseAddress should not be empty",
            "warehouseAddress must be a string",
          ],
          warehouseNumber: [
            "warehouseNumber should not be empty",
            "warehouseNumber must be a string",
          ],
          warehouseType: [
            "warehouseType should not be empty",
            "warehouseType must be a string",
          ],
          messenger: [
            "messenger should not be empty",
            "messenger must be a string",
          ],
          cityRef: ["cityRef should not be empty", "cityRef must be a string"],
          warehouseRef: [
            "warehouseRef should not be empty",
            "warehouseRef must be a string",
          ],
          paymentType: [
            "paymentType must be one of the following values: PREPAY, POSTPAY",
          ],
          messengerType: [
            "messengerType must be one of the following values: TELEGRAM, VIBER, WHATSAPP, INSTAGRAM",
          ],
          cityArea: [
            "cityArea should not be empty",
            "cityArea must be a string",
          ],
          orderProducts: ["orderProducts should not be empty"],
          "orderProducts.0.productId": [
            "productId must be a valid CUID",
            "productId should not be empty",
            "productId must be a string",
          ],
          "orderProducts.0.name": [
            "name should not be empty",
            "name must be a string",
          ],
          "orderProducts.0.price": [
            "price must not be less than 0",
            "price must be a number conforming to the specified constraints",
          ],
          "orderProducts.0.discount": [
            "discount must not be less than 0",
            "discount must be a number conforming to the specified constraints",
          ],
          "orderProducts.0.alias": [
            "alias should not be empty",
            "alias must be a string",
          ],
          "orderProducts.0.image": ["image must be a URL address"],
          "orderProducts.0.quantity": [
            "quantity must not be less than 1",
            "quantity must be a number conforming to the specified constraints",
          ],
          "orderProducts.0.size": ["size must be provided"],
          "orderProducts.0.size.id": [
            "id must be a valid CUID",
            "id should not be empty",
            "id must be a string",
          ],
          "orderProducts.0.size.name": [
            "name should not be empty",
            "name must be a string",
          ],
        },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: "Internal server error",
    type: AppError,
    example: ErrorModel.INTERNAL_SERVER_ERROR,
  })
  @ApiBody({
    description: "Create order data",
    type: CreateOrderDto,
  })
  @UsePipes(OrderValidationPipe)
  @Post()
  create(
    @Body() body: CreateOrderDto,
    @Query("sessionId") sessionId?: string,
  ): Promise<CreateOrderResponseDto> {
    return this.orderService.create({ data: body, sessionId });
  }

  @ApiOperation({
    summary: "Create new invoice by order id",
  })
  @ApiResponse({
    status: 201,
    description: "The invoice has been successfully created.",
    type: RetryOrderResponseDto,
  })
  @ApiParam({
    name: "id",
    required: true,
    description: "The order id",
  })
  @ApiInternalServerErrorResponse({
    description: "Internal server error",
    type: AppError,
    example: ErrorModel.INTERNAL_SERVER_ERROR,
  })
  @Post("/retry/:id")
  retryPayInvoiceOrder(
    @Param("id") orderId: string,
  ): Promise<RetryOrderResponseDto> {
    return this.orderService.retryPayment(orderId);
  }

  @ApiOperation({
    summary: "Find order by id",
  })
  @ApiResponse({
    status: 200,
    description: "The order has been successfully find.",
    type: OrderResponseDto,
    schema: { nullable: true },
  })
  @ApiParam({
    name: "id",
    required: true,
    description: "The order id",
  })
  @ApiInternalServerErrorResponse({
    description: "Internal server error",
    type: AppError,
    example: ErrorModel.INTERNAL_SERVER_ERROR,
  })
  @Get("find/:id")
  findOne(@Param("id") id: string): Promise<OrderResponseDto | null> {
    return this.orderService.findOne({
      where: { id },
    });
  }

  @ApiOperation({
    summary: "Get orders by phone number with pagination",
  })
  @ApiQuery({
    name: "phoneNumber",
    required: false,
    description: "Phone number to search orders for",
    example: "+380501234567",
  })
  @ApiQuery({
    name: "sessionId",
    required: true,
    description: "Session id",
    example: "+380501234567",
  })
  @ApiQuery({
    name: "take",
    required: true,
    type: Number,
    description: "Number of orders to take (default: 10)",
    example: 10,
  })
  @ApiQuery({
    name: "skip",
    required: true,
    type: Number,
    description: "Number of orders to skip for pagination (default: 0)",
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: "List of orders for the specified phone number",
    type: MyOrdersDto,
  })
  @ApiInternalServerErrorResponse({
    description: "Internal server error",
    type: AppError,
    example: ErrorModel.INTERNAL_SERVER_ERROR,
  })
  @Get("my-orders")
  async getMyOrders(
    @Query("sessionId") sessionId: string,
    @Query("take") take: string,
    @Query("skip") skip: string,
    @Query("phoneNumber") phoneNumber?: string,
  ): Promise<MyOrdersDto> {
    return this.orderService.getMyOrders({
      phoneNumber,
      sessionId,
      take: Number(take) || 10,
      skip: Number(skip) || 0,
    });
  }

  @Post("callback/change-status")
  async callbackChangeOrderStatus(@Body() body: CallbackRequestBodyDto) {
    return this.orderService.changeStatusOrder(body);
  }

  @Post("callback")
  callback(@Body() body: OrderCallbackCreateDto) {
    return this.orderService.orderCallback(body);
  }
}
