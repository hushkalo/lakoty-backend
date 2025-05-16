import { ApiProperty } from "@nestjs/swagger";
import { ProductDto } from "./product.dto";

export class AllProductsResponseDto {
  @ApiProperty({
    type: ProductDto,
    isArray: true,
    description: "Array of product objects",
  })
  data: ProductDto[];

  @ApiProperty({
    description: "Total number of products available",
    example: 42,
  })
  total: number;

  @ApiProperty({
    description: "Index of the last product in the current page",
    example: 20,
  })
  to: number;
}
