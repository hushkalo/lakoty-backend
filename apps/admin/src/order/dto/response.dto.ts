import { ApiProperty, OmitType } from "@nestjs/swagger";
import { OrderDto } from "./order.dto";

export class OrdersResponseDto {
  @ApiProperty({
    description: "List of orders",
    type: [OmitType(OrderDto, ["OrderProduct"])],
  })
  data: Omit<OrderDto, "OrderProduct">[];
  @ApiProperty({
    description: "Pagination information",
    example: 100,
  })
  total: number;
  @ApiProperty({
    description: "Pagination information",
    example: 10,
  })
  to: number;
}
