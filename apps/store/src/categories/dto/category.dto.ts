import { ApiProperty } from "@nestjs/swagger";

export class CategoryDto {
  @ApiProperty({
    type: String,
    description: "Unique identifier for the category.",
    example: "cm7z561xb00009l8858oobb68",
  })
  id: string;

  @ApiProperty({
    type: String,
    description: "Name of the category.",
    example: "Electronics",
  })
  name: string;

  @ApiProperty({
    description: "Alias for url.",
    example: "electronics",
  })
  alias: string;

  @ApiProperty({
    type: String,
    description: "Parent category ID.",
    example: "cm7z561xb00009l8858oobb68",
  })
  parentCategoryId: string;

  @ApiProperty({
    type: Boolean,
    description: "Is category hidden.",
    example: "false",
  })
  hidden: boolean;

  @ApiProperty({
    type: Number,
    description: "Is watch depth investment",
    example: 1,
  })
  depth: number;

  @ApiProperty({
    type: String,
    description: "Image URL for the category.",
    example: "https://example.com/images/electronics.jpg",
  })
  imageUrl: string;

  @ApiProperty({
    description:
      "Electronics includes a wide range of devices and gadgets for home and office: smartphones, laptops, tablets, audio equipment, household appliances, and accessories. This category is designed for both professionals and everyday users who want to stay up-to-date with the latest technologies",
  })
  description: string;

  @ApiProperty({
    type: String,
    required: true,
    isArray: true,
    description: "Pathname of the category.",
    example: ["adyag", "zip-hudi"],
  })
  pathname: string[];

  @ApiProperty({
    description: "Last update date",
  })
  updatedAt: Date;
}

export class TreeCategoryDto extends CategoryDto {
  @ApiProperty({
    type: [TreeCategoryDto],
    description: "Subcategories of the category.",
  })
  children: TreeCategoryDto[];
}
