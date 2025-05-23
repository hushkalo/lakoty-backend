import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsNumber,
  IsUrl,
  MinLength,
  MaxLength,
} from "class-validator";
import { IsCUID } from "../../validations/is-cuid.validation";

export class CreateCategoryDto {
  @ApiProperty({
    description: "Name of the category",
    example: "Electronics",
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    required: false,
    description: "Detailed description of the category",
    example: "Electronic devices and accessories",
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description: string;

  @ApiProperty({
    description: "External CRM system identifier",
    example: 12345,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  keyCrmId?: number;

  @ApiProperty({
    description: "URL-friendly version of the category name",
    example: "electronics",
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  alias: string;

  @ApiProperty({
    required: false,
    nullable: true,
    description: "ID of the parent category if this is a subcategory",
    example: "507f1f77bcf86cd799439012",
  })
  @IsString()
  @IsOptional()
  @IsCUID()
  parentCategoryId?: string;

  @ApiProperty({
    required: false,
    description: "URL to the category image",
    example: "https://example.com/images/electronics.jpg",
  })
  @IsUrl()
  @IsOptional()
  imageUrl?: string;
}
