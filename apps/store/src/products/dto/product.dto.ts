import { ApiProperty, OmitType } from "@nestjs/swagger";
import { CategoryDto } from "../../categories/dto/category.dto";

class ProductImageDto {
  @ApiProperty({
    description: "URL of the product image",
    example: "https://example.com/image.jpg",
  })
  url: string;
}

export class ProductSizeDto {
  @ApiProperty({ example: "cm7z5to4t00lx9lsv894t4p7w" })
  id: string;

  @ApiProperty({ example: "XS" })
  name: string;

  @ApiProperty({ example: null, nullable: true })
  sku: string | null;

  @ApiProperty({ example: 1 })
  quantity: number;

  @ApiProperty({ example: true })
  isAvailable: boolean;
}

export class ProductDto {
  @ApiProperty({
    description: "Unique identifier of the product",
    example: "clrr2zyo20000o8w46xmu1suz",
  })
  id: string;

  @ApiProperty({
    description: "Name of the product",
    example: "Classic White T-Shirt",
  })
  name: string;

  @ApiProperty({
    nullable: true,
    description: "Detailed description of the product",
    example: "Comfortable cotton t-shirt with round neck",
  })
  description: string | null;

  @ApiProperty({
    description: "Price of the product in cents",
    example: 2999,
  })
  price: number;

  @ApiProperty({
    description: "Discount percentage for the product",
    example: 15,
  })
  discount: number;

  @ApiProperty({
    description: "Indicates if the product is featured as top product",
    example: true,
  })
  top: boolean;

  @ApiProperty({
    description: "URL-friendly version of product name",
    example: "classic-white-t-shirt",
  })
  alias: string;

  @ApiProperty({
    nullable: true,
    description: "Stock keeping unit identifier",
    example: "WHT-TS-L",
  })
  sku: string | null;

  @ApiProperty({
    description: "Available quantity in stock",
    example: 100,
  })
  quantity: number;

  @ApiProperty({
    nullable: true,
    description: "External CRM system identifier",
    example: 12345,
  })
  keyCrmId: number | null;

  @ApiProperty({
    description: "Indicates if the product is hidden from catalog",
    example: false,
  })
  hidden: boolean;

  @ApiProperty({
    type: [ProductImageDto],
    description: "Array of product images",
    example: [
      {
        url: "https://example.com/product-1.jpg",
      },
    ],
  })
  images: ProductImageDto[];

  @ApiProperty({
    description: "category ID of the product",
    example: "2023-10-01T12:00:00Z",
  })
  categoryId: string;

  @ApiProperty({
    description: "Object containing category details",
    type: CategoryDto,
  })
  category: CategoryDto;

  @ApiProperty({
    type: [ProductSizeDto],
    description: "Array of product sizes",
    example: [
      {
        id: "cm7z5to4t00lx9lsv894t4p7w",
        name: "XS",
        sku: null,
        quantity: 1,
        isAvailable: true,
      },
    ],
  })
  productSizes: ProductSizeDto[];
}

export class RecommendationProductDto extends OmitType(ProductDto, [
  "categoryId",
  "keyCrmId",
  "quantity",
  "productSizes",
]) {}
