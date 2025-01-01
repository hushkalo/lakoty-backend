import { ApiProperty } from "@nestjs/swagger";

export class CreateCategoryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  keyCrmId: number;

  @ApiProperty()
  alias: string;

  @ApiProperty({ required: false })
  parentCategoryId?: string;

  @ApiProperty({ required: false })
  imageUrl: string;

  @ApiProperty({ required: false })
  createdAt?: Date | string;

  @ApiProperty({ required: false })
  updatedAt?: Date | string;
}
