import { ApiProperty } from "@nestjs/swagger";
import { BrandDto } from "./brand.dto";

export class BrandResponseDto {
  @ApiProperty({ type: BrandDto, isArray: true })
  data: BrandDto[];

  @ApiProperty({
    required: true,
    type: Number,
    description: "Total count categories.",
  })
  total: number;

  @ApiProperty({
    required: true,
    type: Number,
    description: "Count show categories.",
  })
  to: number;
}
