import { ApiProperty, OmitType } from "@nestjs/swagger";
import { OrderDto } from "./order.dto";

class OrderDtoWithoutProducts extends OmitType(OrderDto, ["OrderProduct"]) {}

export class OrdersResponseDto {
  @ApiProperty({
    description: "List of orders",
    type: [OrderDtoWithoutProducts],
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
