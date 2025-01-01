import { ApiProperty } from "@nestjs/swagger";

export class CreateProductImageDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  productId: string;
}
