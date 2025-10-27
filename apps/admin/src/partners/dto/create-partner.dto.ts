import { ApiProperty } from "@nestjs/swagger";
import {
  IsNumber,
  IsString,
  IsUrl,
  Length,
  IsBoolean,
  IsOptional,
  Matches,
  IsNotEmpty,
  IsPositive,
} from "class-validator";

export class CreatePartnerDto {
  @ApiProperty({
    description: "Partner name",
    example: "Partner Company Ltd",
    minLength: 3,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 50, {
    message: "Partner name must be between 3 and 50 characters",
  })
  name: string;

  @ApiProperty({
    description: "API key for partner CRM access",
    example: "sk_test_abc123def456ghi789",
  })
  @IsString()
  @IsNotEmpty()
  @Length(10, 100, { message: "API key must be between 10 and 100 characters" })
  apiKey: string;

  @ApiProperty({
    description: "Base URL for partner CRM API",
    example: "https://api.partner.com/v1",
  })
  @IsUrl({}, { message: "API URL must be a valid URL" })
  @IsNotEmpty()
  apiUrl: string;

  @ApiProperty({
    description: "Manager ID in partner CRM system",
    example: 12345,
    minimum: 1,
  })
  @IsNumber({}, { message: "Manager ID must be a number" })
  @IsPositive({ message: "Manager ID must be a positive number" })
  managerId: number;

  @ApiProperty({
    description: "Source ID in partner CRM system",
    example: 20,
    minimum: 1,
  })
  @IsNumber({}, { message: "Source ID must be a number" })
  @IsPositive({ message: "Source ID must be a positive number" })
  sourceId: number;

  @ApiProperty({
    description: "Post-payment method ID in partner CRM",
    example: 1,
    minimum: 1,
  })
  @IsNumber({}, { message: "Post-payment ID must be a number" })
  @IsPositive({ message: "Post-payment ID must be a positive number" })
  postPayId: number;

  @ApiProperty({
    description: "Pre-payment method ID in partner CRM",
    example: 2,
    minimum: 1,
  })
  @IsNumber({}, { message: "Pre-payment ID must be a number" })
  @IsPositive({ message: "Pre-payment ID must be a positive number" })
  prePayId: number;

  @ApiProperty({
    description: "Delivery service ID in partner CRM",
    example: 19,
    minimum: 1,
  })
  @IsNumber({}, { message: "Delivery service ID must be a number" })
  @IsPositive({ message: "Delivery service ID must be a positive number" })
  deliveryServiceId: number;

  @ApiProperty({
    description: "Indicates if partner is currently being updated",
    example: false,
  })
  @IsOptional()
  @IsBoolean({ message: "isUpdate must be a boolean value" })
  isUpdate: boolean;

  @ApiProperty({
    description: "Partner Instagram handle",
    example: "@partner_company",
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUrl({}, { message: "API URL must be a valid URL" })
  instagram?: string;

  @ApiProperty({
    description: "Partner Telegram handle",
    example: "@partner_support",
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUrl({}, { message: "API URL must be a valid URL" })
  telegram?: string;

  @ApiProperty({
    description: "Partner phone number",
    example: "+380501234567",
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message:
      "Phone number must be in international format starting with + and contain 2-15 digits",
  })
  phone?: string;
}
