import { ApiProperty } from "@nestjs/swagger";
import {
  ArrayMinSize,
  IsNotEmpty,
  IsString,
  Matches,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateColorDto {
  @ApiProperty({
    description: "Color name",
    example: "White",
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: "HEX code",
    example: "#FFFFFF",
  })
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6})$/, {
    message: "hex must be a valid HEX color, for example #FFFFFF",
  })
  hex: string;
}

export class ColorDto {
  @ApiProperty({
    description: "Color ID",
    example: "cmf5r5u1x0004vyl95m2a9pqr",
  })
  id: string;

  @ApiProperty({
    description: "Color name",
    example: "White",
  })
  name: string;

  @ApiProperty({
    description: "HEX code",
    example: "#FFFFFF",
  })
  hex: string;

  @ApiProperty({
    description: "Creation timestamp",
    example: "2026-04-25T10:00:00.000Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Update timestamp",
    example: "2026-04-25T10:00:00.000Z",
  })
  updatedAt: Date;
}

export class AllColorsResponseDto {
  @ApiProperty({
    description: "List of colors",
    type: [ColorDto],
  })
  data: ColorDto[];
}

export class CreateColorsDto {
  @ApiProperty({
    description: "Colors to create",
    type: [CreateColorDto],
    example: [
      { name: "White", hex: "#FFFFFF" },
      { name: "Black", hex: "#000000" },
    ],
  })
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateColorDto)
  colors: CreateColorDto[];
}

export class CreateColorsResponseDto {
  @ApiProperty({
    description: "Created colors",
    type: [ColorDto],
  })
  data: ColorDto[];

  @ApiProperty({
    description: "Created colors count",
    example: 2,
  })
  total: number;
}


