import { ApiProperty } from "@nestjs/swagger";
import { OrderDto } from "./order.dto";

export class CreateOrderResponseDto {
  @ApiProperty({
    example: "Create order successfully",
    description: "The unique identifier of the created order",
  })
  message: string;

  @ApiProperty({
    example: "https://example.com/payment-page",
    description:
      "The URL for the payment page where the user can complete the payment",
    required: false,
  })
  paymentPageUrl?: string;

  @ApiProperty({
    example: "qwertyqweqwe",
    description: "Order id",
    required: false,
  })
  orderId: string;
}

export class RetryOrderResponseDto {
  @ApiProperty({
    example: "Create invoice successfully",
    description: "The unique identifier of the created invoice",
  })
  message: string;

  @ApiProperty({
    example: "https://example.com/payment-page",
    description:
      "The URL for the payment page where the user can complete the payment",
  })
  paymentPageUrl: string;
}

export class OrderResponseDto extends OrderDto {}

export class MyOrdersDto {
  @ApiProperty({
    description: "Count order arrived",
    type: OrderDto,
    isArray: true,
  })
  orders: OrderDto[];

  @ApiProperty({
    description: "Total orders sum",
    example: 3,
  })
  countArrived: number;

  @ApiProperty({
    description: "Count order on road",
    example: 4,
  })
  countOnRoad: number;

  @ApiProperty({
    description: "Count order",
    example: 50,
  })
  total: number;

  @ApiProperty({
    description: "Count order on page",
    example: 10,
  })
  to: number;
}
