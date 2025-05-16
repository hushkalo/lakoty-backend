import { ApiProperty } from "@nestjs/swagger";

export class ProductImage {
  @ApiProperty({ description: "Unique identifier", example: "img123" })
  id: string;

  @ApiProperty({
    description: "Image URL",
    example: "https://example.com/image.jpg",
  })
  url: string;

  @ApiProperty({ description: "Display order", example: 1 })
  order: number;

  @ApiProperty({ description: "Associated product ID", example: "prod123" })
  productId: string;
}

export class ProductSize {
  @ApiProperty({ description: "Unique identifier", example: "size123" })
  id: string;

  @ApiProperty({ description: "Size name", example: "Large" })
  name: string;

  @ApiProperty({
    description: "Stock keeping unit",
    nullable: true,
    example: "SKU123",
  })
  sku: string | null;

  @ApiProperty({ description: "Available quantity", example: 100 })
  quantity: number;

  @ApiProperty({ description: "Whether size is available", example: true })
  isAvailable: boolean;

  @ApiProperty({ description: "External CRM ID", example: 12345 })
  keyCrmId: number;

  @ApiProperty({ description: "Associated product ID", example: "prod123" })
  productId: string;

  @ApiProperty({
    description: "Creation timestamp",
    example: "2024-01-01T00:00:00Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Last update timestamp",
    example: "2024-01-02T00:00:00Z",
  })
  updatedAt: Date;
}

export class Category {
  @ApiProperty({ description: "Unique identifier", example: "cat123" })
  id: string;

  @ApiProperty({ description: "Category name", example: "T-Shirts" })
  name: string;

  @ApiProperty({
    description: "Category description",
    nullable: true,
    example: "Collection of t-shirts",
  })
  description: string | null;

  @ApiProperty({ description: "External CRM ID", example: 67890 })
  keyCrmId: number;

  @ApiProperty({ description: "URL-friendly name", example: "t-shirts" })
  alias: string;

  @ApiProperty({
    description: "Parent category ID",
    nullable: true,
    example: "parent123",
  })
  parentCategoryId: string | null;

  @ApiProperty({
    description: "Category image URL",
    example: "https://example.com/category.jpg",
  })
  imageUrl: string;

  @ApiProperty({ description: "Whether category is hidden", example: false })
  hidden: boolean;

  @ApiProperty({ description: "Nesting depth level", example: 1 })
  depth: number;

  @ApiProperty({ description: "Whether category is featured", example: true })
  top: boolean;

  @ApiProperty({
    description: "Category path hierarchy",
    type: [String],
    example: ["clothing", "t-shirts"],
  })
  pathname: string[];

  @ApiProperty({
    description: "Creation timestamp",
    example: "2024-01-01T00:00:00Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Last update timestamp",
    example: "2024-01-02T00:00:00Z",
  })
  updatedAt: Date;
}

export class ProductCount {
  @ApiProperty({ description: "Number of product images", example: 5 })
  images: number;

  @ApiProperty({ description: "Number of product sizes", example: 3 })
  productSizes: number;

  @ApiProperty({
    description: "Number of orders containing product",
    example: 10,
  })
  OrderProduct: number;
}

export class ProductDto {
  @ApiProperty({ description: "Unique identifier", example: "prod123" })
  id: string;

  @ApiProperty({ description: "Product name", example: "Classic T-Shirt" })
  name: string;

  @ApiProperty({
    description: "Product description",
    nullable: true,
    example: "Comfortable cotton t-shirt",
  })
  description: string | null;

  @ApiProperty({ description: "Product price", example: 29.99 })
  price: number;

  @ApiProperty({ description: "Discount percentage", example: 10 })
  discount: number;

  @ApiProperty({ description: "Whether product is featured", example: true })
  top: boolean;

  @ApiProperty({ description: "URL-friendly name", example: "classic-t-shirt" })
  alias: string;

  @ApiProperty({
    description: "Stock keeping unit",
    nullable: true,
    example: "SKU789",
  })
  sku: string | null;

  @ApiProperty({ description: "Available quantity", example: 50 })
  quantity: number;

  @ApiProperty({ description: "External CRM ID", example: 13579 })
  keyCrmId: number;

  @ApiProperty({ description: "Whether product is hidden", example: false })
  hidden: boolean;

  @ApiProperty({ description: "Total sales count", example: 100 })
  salesCount: number;

  @ApiProperty({ description: "Associated category ID", example: "cat123" })
  categoryId: string;

  @ApiProperty({
    description: "Creation timestamp",
    example: "2024-01-01T00:00:00Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Last update timestamp",
    example: "2024-01-02T00:00:00Z",
  })
  updatedAt: Date;

  @ApiProperty({ description: "Product images", type: [ProductImage] })
  images: ProductImage[];

  @ApiProperty({ description: "Product sizes", type: [ProductSize] })
  productSizes: ProductSize[];

  @ApiProperty({ description: "Product category", type: Category })
  category: Category;

  @ApiProperty({ description: "Related counts", type: ProductCount })
  _count: ProductCount;
}
