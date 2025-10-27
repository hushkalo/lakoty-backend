import { ApiProperty } from "@nestjs/swagger";

export class BrandDto {
  @ApiProperty({
    type: String,
    example: "brand_123",
    description: "Unique identifier for the brand",
  })
  id: string;

  @ApiProperty({
    type: String,
    example: "Nike",
    description: "Name of the brand",
  })
  name: string;

  @ApiProperty({
    type: String,
    nullable: true,
    example: "https://example.com/image.png",
    description: "URL of the brand's image, can be null",
  })
  imageUrl: string | null;
}
