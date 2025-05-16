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
  IsNotEmpty,
  ArrayMinSize,
  IsOptional,
} from "class-validator";
import { ProductImage, ProductSize } from "./create-product.dto";

export class UpdateProductImage extends ProductImage {
  @ApiProperty({
    description: "Unique identifier",
    example: "img-123",
    required: false,
  })
  @IsOptional()
  @IsString()
  id: string;
}

export class UpdateProductSize extends ProductSize {
  @ApiProperty({
    description: "Unique identifier",
    example: "size-123",
    required: false,
  })
  @IsOptional()
  @IsString()
  id: string;
}

export class UpdateProductDto {
  @ApiProperty({
    description: "Name of the product",
    example: "Blue T-Shirt",
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: "Detailed description of the product",
    example: "Comfortable cotton t-shirt in blue color",
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: "Price of the product",
    example: 29.99,
    required: false,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  price: number;

  @ApiProperty({
    description: "URL-friendly alias for the product",
    example: "blue-t-shirt",
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  alias: string;

  @ApiProperty({
    description: "ID of the category this product belongs to",
    example: "cat-123",
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({
    description: "Available quantity of the product",
    example: 100,
    required: false,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  quantity: number;

  @ApiProperty({
    description: "Array of product images",
    type: UpdateProductImage,
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => UpdateProductImage)
  images: UpdateProductImage[];

  @ApiProperty({
    description: "Discount percentage for the product",
    example: 10,
    required: false,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  discount: number;

  @ApiProperty({
    description: "Flag indicating if this is a featured/top product",
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  top: boolean;

  @ApiProperty({
    description: "Available sizes for the product",
    type: UpdateProductSize,
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => UpdateProductSize)
  productSizes: UpdateProductSize[];
}
