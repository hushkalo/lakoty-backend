import { ApiProperty } from "@nestjs/swagger";
import { CategoryDto } from "./category.dto";

class CategoriesWithSubCategoriesResponseDto extends CategoryDto {
  @ApiProperty({
    type: () => [CategoryDto],
    required: false,
  })
  subCategories?: CategoryDto[];
}

export class CategoriesResponseDto {
  @ApiProperty({ type: CategoriesWithSubCategoriesResponseDto, isArray: true })
  data: CategoriesWithSubCategoriesResponseDto[];

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

export class CategoryWithCountSubCategoriesResponseDto extends CategoryDto {
  @ApiProperty({
    type: () => [CategoryDto],
    required: true,
    example: [],
  })
  subCategories: CategoryDto[];
  @ApiProperty({
    required: true,
    type: Number,
    description: "Count subcategories.",
    example: 0,
  })
  countSubCategories: number;

  @ApiProperty({
    required: true,
    type: () => CategoryDto,
    description: "Parent category.",
    example: CategoryDto,
    nullable: true,
  })
  parentCategory: CategoryDto;
}
