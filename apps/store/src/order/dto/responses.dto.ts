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
      "Monobank payment page. The order is created only after the payment is confirmed.",
  })
  paymentPageUrl: string;

  @ApiProperty({
    example: "clhlw1mlq0000ksvm3gfy3eur",
    description: "Checkout id — use it to poll GET /orders/checkout/{id}",
  })
  checkoutId: string;

  @ApiProperty({
    example: 200,
    description:
      "Amount to pay online now, UAH (full sum or the minimum prepayment)",
  })
  prepaidAmount: number;

  @ApiProperty({ example: 1500, description: "Order total, UAH" })
  totalAmount: number;

  @ApiProperty({
    example: "qwertyqweqwe",
    description:
      "Deprecated: the order does not exist until payment is confirmed",
    required: false,
  })
  orderId?: string;
}

export const CHECKOUT_STATUSES = [
  "pending",
  "processing",
  "paid",
  "creating",
  "completed",
  "failure",
  "expired",
] as const;

export class CheckoutStatusResponseDto {
  @ApiProperty({ example: "clhlw1mlq0000ksvm3gfy3eur" })
  id: string;

  @ApiProperty({
    enum: CHECKOUT_STATUSES,
    description:
      "pending/processing — waiting for payment; paid/creating — paid, the order is being created; completed — order created; failure/expired — not paid",
  })
  status: (typeof CHECKOUT_STATUSES)[number];

  @ApiProperty({ example: "POSTPAY" })
  paymentType: string;

  @ApiProperty({ example: 1500 })
  totalAmount: number;

  @ApiProperty({ example: 200 })
  prepaidAmount: number;

  @ApiProperty({ required: false, nullable: true, type: String })
  orderId: string | null;

  @ApiProperty({ required: false, nullable: true, type: () => OrderDto })
  order: OrderDto | null;
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
