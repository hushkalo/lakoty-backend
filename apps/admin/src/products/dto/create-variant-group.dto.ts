import { ApiProperty } from "@nestjs/swagger";
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { IsCUID } from "../../validations/is-cuid.validation";

export class CreateVariantGroupDto {
  @ApiProperty({
    description: "Optional group display name",
    example: "Jordan 1 Mid",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiProperty({
    description:
      "Optional product IDs to immediately attach to the created color variant group",
    example: ["cmf5r3n4x0001vyl9f2h3k7ab", "cmf5r3n4x0002vyl9f2h3k7ac"],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsCUID({ each: true })
  productIds?: string[];
}

export class CreateVariantGroupResponseDto {
  @ApiProperty({
    description: "Created variant group ID",
    example: "cmf5r3n4x0001vyl9f2h3k7ab",
  })
  id: string;

  @ApiProperty({
    description: "Variant group name",
    example: "Jordan 1 Mid",
    nullable: true,
  })
  name: string | null;

  @ApiProperty({
    description: "Products attached to this group during creation",
    example: ["cmf5r3n4x0002vyl9f2h3k7ac"],
    type: [String],
  })
  productIds: string[];
}

export class VariantGroupDto {
  @ApiProperty({
    description: "Variant group ID",
    example: "cmf5r3n4x0001vyl9f2h3k7ab",
  })
  id: string;

  @ApiProperty({
    description: "Variant group name",
    example: "Jordan 1 Mid",
    nullable: true,
  })
  name: string | null;

  @ApiProperty({
    description: "Products linked to this group",
    example: ["cmf5r3n4x0002vyl9f2h3k7ac", "cmf5r3n4x0003vyl9f2h3k7ad"],
    type: [String],
  })
  productIds: string[];

  @ApiProperty({
    description: "Created at",
    example: "2026-04-25T10:00:00.000Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Updated at",
    example: "2026-04-25T10:00:00.000Z",
  })
  updatedAt: Date;
}

export class AllVariantGroupsResponseDto {
  @ApiProperty({
    description: "Variant groups list",
    type: [VariantGroupDto],
  })
  data: VariantGroupDto[];

  @ApiProperty({
    description: "Total count",
    example: 10,
  })
  total: number;
}

