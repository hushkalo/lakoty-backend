import { ApiProperty } from "@nestjs/swagger";

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
}
