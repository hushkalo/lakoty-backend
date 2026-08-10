import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class MarketingDto {
  @ApiProperty({
    description: "UTM source of the traffic",
    example: "facebook",
    required: false,
  })
  @IsString()
  @IsOptional()
  utm_source?: string;

  @ApiProperty({
    description: "UTM medium of the traffic",
    example: "banner",
    required: false,
  })
  @IsString()
  @IsOptional()
  utm_medium?: string;

  @ApiProperty({
    description: "UTM campaign name",
    example: "sale",
    required: false,
  })
  @IsString()
  @IsOptional()
  utm_campaign?: string;

  @ApiProperty({
    description: "UTM term (paid keyword)",
    example: "landing page",
    required: false,
  })
  @IsString()
  @IsOptional()
  utm_term?: string;

  @ApiProperty({
    description: "UTM content (ad variation)",
    example: "-30%",
    required: false,
  })
  @IsString()
  @IsOptional()
  utm_content?: string;
}
