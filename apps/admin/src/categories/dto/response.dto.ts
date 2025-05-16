import { ApiProperty } from "@nestjs/swagger";
import { CategoryDto } from "./category.dto";

export class AllCategoriesResponseDto {
  @ApiProperty({
    type: CategoryDto,
    isArray: true,
    description: "Array of category objects",
  })
  data: CategoryDto[];

  @ApiProperty({
    description: "Total number of categories available",
    example: 42,
  })
  total: number;

  @ApiProperty({
    description: "Index of the last category in the current page",
    example: 20,
  })
  to: number;
}
