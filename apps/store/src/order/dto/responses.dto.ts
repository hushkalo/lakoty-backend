import { ApiProperty } from "@nestjs/swagger";

export class CreateOrderResponseDto {
  @ApiProperty({
    example: "Create order successfully",
    description: "The unique identifier of the created order",
  })
  message: string;
}
