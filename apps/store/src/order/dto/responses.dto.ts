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
