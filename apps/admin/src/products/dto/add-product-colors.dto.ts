import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { IsCUID } from "../../validations/is-cuid.validation";

export class AddProductColorsDto {
  @ApiProperty({
    description: "Color ID to assign to this product. Pass null to remove color.",
    example: "cmf5r5u1x0004vyl95m2a9pqr",
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsCUID()
  colorId: string | null;
}

export class AddProductColorsResponseDto {
  @ApiProperty({
    description: "Product ID",
    example: "cmf5r3n4x0002vyl9f2h3k7ac",
  })
  productId: string;

  @ApiProperty({
    description: "Color ID assigned to the product",
    example: "cmf5r5u1x0004vyl95m2a9pqr",
    nullable: true,
  })
  colorId: string | null;
}


