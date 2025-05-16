import { ApiProperty, OmitType } from "@nestjs/swagger";

class Count {
  @ApiProperty({
    description: "Number of subcategories under this category",
    example: 5,
  })
  subCategories: number;

  @ApiProperty({
    description: "Number of products under this category",
    example: 100,
  })
  products: number;
}

export class CategoryDto {
  @ApiProperty({
    description: "Unique identifier of the category",
    example: "507f1f77bcf86cd799439011",
  })
  id: string;

  @ApiProperty({
    description: "Name of the category",
    example: "Electronics",
  })
  name: string;

  @ApiProperty({
    nullable: true,
    description: "Detailed description of the category",
    example: "Electronic devices and accessories",
  })
  description: string | null;

  @ApiProperty({
    nullable: true,
    description: "External CRM system identifier",
    example: 12345,
  })
  keyCrmId: number | null;

  @ApiProperty({
    description: "URL-friendly version of the category name",
    example: "electronics",
  })
  alias: string;

  @ApiProperty({
    nullable: true,
    description: "ID of the parent category if this is a subcategory",
    example: "507f1f77bcf86cd799439012",
  })
  parentCategoryId: string | null;

  @ApiProperty({
    nullable: true,
    description: "URL to the category image",
    example: "https://example.com/images/electronics.jpg",
  })
  imageUrl: string | null;

  @ApiProperty({
    description: "Whether the category is hidden from users",
    example: false,
  })
  hidden: boolean;

  @ApiProperty({
    description: "Level of nesting in category hierarchy",
    example: 1,
  })
  depth: number;

  @ApiProperty({
    description: "Whether the category is featured at the top",
    example: true,
  })
  top: boolean;

  @ApiProperty({
    type: [String],
    description: "Full path of category names from root to current category",
    example: ["Root", "Electronics", "Smartphones"],
  })
  pathname: string[];

  @ApiProperty({
    description: "Subcategories of this category",
    type: OmitType(CategoryDto, ["_count", "subCategories"]),
    isArray: true,
  })
  subCategories: Omit<CategoryDto, "subCategories" | "_count">[];

  @ApiProperty({
    description: "Count of subcategories and products under this category",
    type: Count,
  })
  _count: Count;

  @ApiProperty({
    description: "Timestamp when the category was created",
    example: "2024-02-15T10:30:00Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Timestamp when the category was last updated",
    example: "2024-02-16T15:45:00Z",
  })
  updatedAt: Date;
}
