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
import { CreateProductImage, CreateProductSize } from "./create-product.dto";
import { IsCUID } from "../../validations/is-cuid.validation";

export class UpdateProductImage extends CreateProductImage {
  @ApiProperty({
    description: "Unique identifier",
    example: "img-123",
    required: false,
  })
  @IsOptional()
  @IsString()
  id: string;
}

export class UpdateProductSize extends CreateProductSize {
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
    description: "Flag indicating if this is a novelty product",
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isNovelty: boolean;

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

  @ApiProperty({
    description: "Variant group ID used to link products by color",
    example: "cmf5r3n4x0001vyl9f2h3k7ab",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @IsCUID()
  variantGroupId?: string;

  @ApiProperty({
    description:
      "Alias for variantGroupId. Use this to attach product to an existing group via update.",
    example: "cmf5r3n4x0001vyl9f2h3k7ab",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @IsCUID()
  groupId?: string;

  @ApiProperty({
    description: "Color ID to assign to this product. Pass null to remove color.",
    example: "cmf5r5u1x0004vyl95m2a9pqr",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @IsCUID()
  colorId?: string | null;
}
