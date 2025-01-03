import { ApiProperty } from "@nestjs/swagger";

export class CreateProductSizeDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  isAvailable: boolean;

  @ApiProperty()
  sku?: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  Product: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
