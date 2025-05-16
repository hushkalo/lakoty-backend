import { ApiProperty } from "@nestjs/swagger";

export class FileUploadDto {
  @ApiProperty({ type: "string", format: "binary" })
  file: any;
}

export class FilesUploadDto {
  @ApiProperty({ type: "array", items: { type: "string", format: "binary" } })
  files: any[];
}

export class UploadResponseDto {
  @ApiProperty({
    type: String,
    description: "The URL of the uploaded file",
    example: "https://example.com/path/to/file.jpg",
  })
  url: string;
}

export class UploadMultipleResponseDto extends UploadResponseDto {
  @ApiProperty({
    type: Number,
    description: "Order of the uploaded file",
    example: 0,
  })
  order: number;
}
