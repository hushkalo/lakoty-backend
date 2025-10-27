import { ApiProperty } from "@nestjs/swagger";

export class UploadProductsResponseDto {
  @ApiProperty({
    description: "Indicates if the upload was successful",
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: "Total number of products processed",
    example: 150,
  })
  total: number;

  @ApiProperty({
    description: "Number of products created",
    example: 120,
  })
  created: number;

  @ApiProperty({
    description: "Number of products updated",
    example: 25,
  })
  updated: number;

  @ApiProperty({
    description: "Number of products skipped (archived or invalid)",
    example: 5,
  })
  skipped: number;

  @ApiProperty({
    description: "Summary message of the operation",
    example:
      "Successfully synced 120 new and 25 updated products from partner Example Partner",
  })
  message: string;
}
