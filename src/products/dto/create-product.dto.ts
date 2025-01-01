import { ApiProperty } from "@nestjs/swagger";
import { ProductImage, ProductSize } from "@prisma/client";

export class CreateProductDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  price: number;

  @ApiProperty({ required: false })
  alias: string;

  @ApiProperty()
  categoryId: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  images: ProductImage[];

  @ApiProperty()
  keyCrmId: number;

  @ApiProperty()
  discount: number;

  @ApiProperty()
  topProduct: boolean;

  @ApiProperty()
  productSizes: ProductSize[];

  @ApiProperty({ required: false })
  createdAt?: Date | string;

  @ApiProperty({ required: false })
  updatedAt?: Date | string;
}
