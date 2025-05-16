import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
  Max,
  IsUrl,
  IsNotEmpty,
  ArrayMinSize,
  IsOptional,
} from "class-validator";

export class ProductImage {
  @ApiProperty({
    description: "URL of the product image",
    example: "https://example.com/image.jpg",
  })
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @ApiProperty({
    description: "Order of the image in the gallery",
    example: 1,
  })
  @IsNumber()
  @Min(0)
  order: number;
}

export class ProductSize {
  @ApiProperty({
    description: "Name of the product size",
    example: "XL",
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: "Stock keeping unit (SKU) code",
    example: "XL-BLU-123",
  })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({
    description: "Available quantity for this size",
    example: 50,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({
    description: "Whether this size is currently available",
    example: true,
  })
  @IsBoolean()
  isAvailable: boolean;
}

export class CreateProductDto {
  @ApiProperty({
    description: "Name of the product",
    example: "Blue T-Shirt",
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: "Detailed description of the product",
    example: "Comfortable cotton t-shirt in blue color",
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: "Price of the product",
    example: 29.99,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: "URL-friendly alias for the product",
    example: "blue-t-shirt",
  })
  @IsString()
  @IsNotEmpty()
  alias: string;

  @ApiProperty({
    description: "ID of the category this product belongs to",
    example: "cat-123",
  })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({
    description: "Available quantity of the product",
    example: 100,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({
    description: "Array of product images",
    type: [ProductImage],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => ProductImage)
  images: ProductImage[];

  @ApiProperty({
    description: "Discount percentage for the product",
    example: 10,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  discount: number;

  @ApiProperty({
    description: "Flag indicating if this is a featured/top product",
    example: true,
  })
  @IsBoolean()
  top: boolean;

  @ApiProperty({
    description: "Available sizes for the product",
    type: ProductSize,
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => ProductSize)
  productSizes?: ProductSize[];

  @ApiProperty({
    description: "Flag indicating if the product should be created in CRM",
    example: true,
  })
  @IsBoolean()
  isCreateOnCrm: boolean;
}
