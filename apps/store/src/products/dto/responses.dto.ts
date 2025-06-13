import { ApiProperty } from "@nestjs/swagger";
import { ProductDto, RecommendationProductDto } from "./product.dto";

export class ProductsResponseDto {
  @ApiProperty({ type: ProductDto, isArray: true })
  data: ProductDto[];

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

export class ProductWithRecommendationResponseDto extends ProductDto {
  @ApiProperty({
    type: ProductDto,
    isArray: true,
    description: "Recommendations products.",
  })
  recommendations: RecommendationProductDto[];
}
export class ProductSizesResponseDto {
  @ApiProperty({
    type: String,
    isArray: true,
    description: "Product sizes.",
  })
  data: string[];
}
