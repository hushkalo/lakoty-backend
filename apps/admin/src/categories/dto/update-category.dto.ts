import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsNumber,
  IsUrl,
  IsUUID,
  Length,
  Matches,
} from "class-validator";

export class UpdateCategoryDto {
  @ApiProperty({
    description: "Name of the category",
    example: "Electronics",
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;

  @ApiProperty({
    required: false,
    description: "Detailed description of the category",
    example: "Electronic devices and accessories",
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  description?: string;

  @ApiProperty({
    description: "External CRM system identifier",
    example: 12345,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  keyCrmId?: number;

  @ApiProperty({
    description: "URL-friendly version of the category name",
    example: "electronics",
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: "Alias can only contain lowercase letters, numbers and hyphens",
  })
  @Length(2, 100)
  alias?: string;

  @ApiProperty({
    required: false,
    nullable: true,
    description: "ID of the parent category if this is a subcategory",
    example: "507f1f77bcf86cd799439012",
  })
  @IsOptional()
  @IsUUID()
  parentCategoryId?: string;

  @ApiProperty({
    required: false,
    description: "URL to the category image",
    example: "https://example.com/images/electronics.jpg",
  })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;
}
