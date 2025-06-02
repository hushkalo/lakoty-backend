import { ApiProperty } from "@nestjs/swagger";

export class CrmProductDto {
  @ApiProperty({
    description: "Unique identifier of the product in CRM",
    example: 123,
  })
  id: number;

  @ApiProperty({
    description: "Name of the product",
    example: "T-shirt Classic",
  })
  name: string;

  @ApiProperty({
    description: "Description of the product",
    example: "A classic cotton T-shirt available in various sizes.",
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: "URL to the product thumbnail image",
    example: "https://example.com/images/product-thumbnail.jpg",
  })
  thumbnail_url: string;

  @ApiProperty({
    description: "Array of URLs to product attachments",
    example: ["https://example.com/images/attachment1.jpg"],
    type: [String],
  })
  attachments_data: string[];

  @ApiProperty({
    description: "Available quantity of the product",
    example: 50,
  })
  quantity: number;

  @ApiProperty({
    description: "Unit type for the product",
    example: "pcs",
    nullable: true,
  })
  unit_type: string | null;

  @ApiProperty({
    description: "Number of items in reserve",
    example: 10,
  })
  in_reserve: number;

  @ApiProperty({
    description: "Currency code for the product price",
    example: "USD",
  })
  currency_code: string;

  @ApiProperty({
    description: "Minimum price of the product",
    example: 9.99,
  })
  min_price: number;

  @ApiProperty({
    description: "Maximum price of the product",
    example: 19.99,
  })
  max_price: number;

  @ApiProperty({
    description: "Weight of the product in kilograms",
    example: 0.5,
  })
  weight: number;

  @ApiProperty({
    description: "Length of the product in centimeters",
    example: 30,
  })
  length: number;

  @ApiProperty({
    description: "Height of the product in centimeters",
    example: 2,
  })
  height: number;

  @ApiProperty({
    description: "Width of the product in centimeters",
    example: 20,
  })
  width: number;

  @ApiProperty({
    description: "Indicates if the product has offers",
    example: true,
  })
  has_offers: boolean;

  @ApiProperty({
    description: "Indicates if the product is archived",
    example: false,
  })
  is_archived: boolean;

  @ApiProperty({
    description: "Category ID of the product",
    example: 5,
  })
  category_id: number;

  @ApiProperty({
    description: "Product creation date in ISO format",
    example: "2024-06-01T12:00:00Z",
  })
  created_at: string;

  @ApiProperty({
    description: "Product last update date in ISO format",
    example: "2024-06-10T15:30:00Z",
  })
  updated_at: string;

  @ApiProperty({
    description: "SKU (Stock Keeping Unit) of the product",
    example: "TSHIRT-CL-001",
    nullable: true,
  })
  sku: string | null;

  @ApiProperty({
    description: "Barcode of the product",
    example: "1234567890123",
    nullable: true,
  })
  barcode: string | null;

  @ApiProperty({
    description: "Current price of the product",
    example: 14.99,
  })
  price: number;

  @ApiProperty({
    description: "Purchased price of the product",
    example: 8.99,
  })
  purchased_price: number;

  @ApiProperty({
    description: "Sources related to the product (empty array by default)",
    example: [],
    type: [Object],
  })
  sources: never[];
}
