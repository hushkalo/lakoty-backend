import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

class BasketItemSizeDto {
  @ApiProperty({
    description: "The id size of the basket item",
    required: true,
  })
  id?: string;

  @ApiProperty({
    description: "The name size of the basket item",
  })
  name: string;
}

export class BasketItemDto {
  @ApiProperty({ description: "Product unique identifier" })
  productId: string;

  @ApiProperty({ description: "Product name" })
  name: string;

  @ApiProperty({
    description: "Product size",
    type: BasketItemSizeDto,
  })
  size: {
    id?: string;
    name: string;
  };

  @ApiProperty({ description: "Product price" })
  price: number;

  @ApiProperty({ description: "Discount applied to the product" })
  discount: number;

  @ApiProperty({ description: "Product alias" })
  alias: string;

  @ApiProperty({ description: "Product image URL" })
  image: string;

  @ApiProperty({ description: "Quantity of the product" })
  quantity: number;

  @ApiPropertyOptional({ description: "Stock Keeping Unit" })
  sku?: string;

  @ApiProperty({
    description: "Pathname to product",
  })
  pathname: string;
}

export class DefaultMessageDto {
  @ApiProperty({
    description: "Message response",
    example: "OK",
  })
  message: string;
}
