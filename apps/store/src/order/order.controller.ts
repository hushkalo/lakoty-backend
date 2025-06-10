import { Controller, Post, Body, UsePipes } from "@nestjs/common";
import { OrderService } from "./order.service";
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { CreateOrderResponseDto } from "./dto/responses.dto";
import { OrderValidationPipe } from "../pipes/order-validation.pipe";
import { AppError, ErrorModel } from "@shared/error-model";
import { CreateOrderDto } from "./dto/create-order.dto";

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
  create(@Body() body: CreateOrderDto): Promise<CreateOrderResponseDto> {
    return this.orderService.createOrderInCrm({ data: body });
  }
}
