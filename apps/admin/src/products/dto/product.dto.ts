import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ColorDto } from "./color.dto";

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

export class ProductSizeDto {
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

export class ProductCategoryDto {
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

  @ApiProperty({ description: "External CRM ID", example: 67890, nullable: true })
  keyCrmId: number | null;

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
    nullable: true,
    example: "https://example.com/category.jpg",
  })
  imageUrl: string | null;

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

export class ProductVariantGroupItemDto {
  @ApiProperty({ description: "Product ID in group", example: "prod456" })
  id: string;

  @ApiProperty({ description: "Product color", type: ColorDto, nullable: true })
  color: ColorDto | null;
}

export class ProductVariantGroupDto {
  @ApiProperty({ description: "Group ID", example: "group123" })
  id: string;

  @ApiProperty({ description: "Group name", nullable: true, example: "Nike Air Max 270" })
  name: string | null;

  @ApiProperty({ description: "Products in this group", type: [ProductVariantGroupItemDto] })
  products: ProductVariantGroupItemDto[];
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

  @ApiProperty({ description: "External CRM ID", nullable: true, example: 13579 })
  keyCrmId: number | null;

  @ApiProperty({ description: "Whether product is hidden", example: false })
  hidden: boolean;

  @ApiProperty({ description: "Is novelty product?", example: false })
  isNovelty: boolean;

  @ApiProperty({ description: "Total sales count", example: 100 })
  salesCount: number;

  @ApiProperty({ description: "Associated category ID", example: "cat123" })
  categoryId: string;

  @ApiProperty({
    description: "Associated second category ID",
    example: "cat456",
    nullable: true,
  })
  secondCategoryId: string | null;

  @ApiProperty({ description: "Partner ID", nullable: true, example: "partner123" })
  partnersId: string | null;

  @ApiProperty({ description: "Brand ID", nullable: true, example: "brand123" })
  brandsId: string | null;

  @ApiProperty({ description: "Color ID", nullable: true, example: "color123" })
  colorId: string | null;

  @ApiProperty({ description: "Variant group ID", nullable: true, example: "group123" })
  variantGroupId: string | null;

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

  @ApiProperty({ description: "Product sizes", type: [ProductSizeDto] })
  productSizes: ProductSizeDto[];

  @ApiProperty({ description: "Product category", type: ProductCategoryDto })
  category: ProductCategoryDto;

  @ApiProperty({
    description: "Product second category",
    type: ProductCategoryDto,
    nullable: true,
  })
  secondCategory?: ProductCategoryDto | null;

  @ApiPropertyOptional({
    description: "Product color",
    type: ColorDto,
    nullable: true,
  })
  color?: ColorDto | null;

  @ApiPropertyOptional({
    description: "Variant group",
    type: ProductVariantGroupDto,
    nullable: true,
  })
  variantGroup?: ProductVariantGroupDto | null;

  @ApiProperty({ description: "Related counts", type: ProductCount })
  _count: ProductCount;
}

// Keep old alias for backward compat
export { ProductCategoryDto as Category };
