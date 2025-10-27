import { ApiProperty } from "@nestjs/swagger";

export class PartnerDto {
  @ApiProperty({
    description: "Unique identifier of the partner",
    example: "clhlw1mlq0000ksvm3gfy3eur",
  })
  id: string;

  @ApiProperty({
    description: "Partner name",
    example: "Partner Company Ltd",
  })
  name: string;

  @ApiProperty({
    description: "API key for partner CRM access",
    example: "sk_test_abc123def456ghi789",
  })
  apiKey: string;

  @ApiProperty({
    description: "Base URL for partner CRM API",
    example: "https://api.partner.com/v1",
  })
  apiUrl: string;

  @ApiProperty({
    description: "Manager ID in partner CRM system",
    example: 12345,
  })
  managerId: number;

  @ApiProperty({
    description: "Source ID in partner CRM system",
    example: 20,
  })
  sourceId: number;

  @ApiProperty({
    description: "Post-payment method ID in partner CRM",
    example: 1,
  })
  postPayId: number;

  @ApiProperty({
    description: "Pre-payment method ID in partner CRM",
    example: 2,
  })
  prePayId: number;

  @ApiProperty({
    description: "Delivery service ID in partner CRM",
    example: 19,
  })
  deliveryServiceId: number;

  @ApiProperty({
    description: "Indicates if partner is currently being updated",
    example: false,
  })
  isUpdate: boolean;

  @ApiProperty({
    description: "Partner Instagram handle",
    example: "@partner_company",
    nullable: true,
  })
  instagram: string | null;

  @ApiProperty({
    description: "Partner Telegram handle",
    example: "@partner_support",
    nullable: true,
  })
  telegram: string | null;

  @ApiProperty({
    description: "Partner phone number",
    example: "+380501234567",
    nullable: true,
  })
  phone: string | null;

  @ApiProperty({
    description: "Partner creation date",
    example: "2024-01-15T10:30:00.000Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Partner last update date",
    example: "2024-10-27T14:20:00.000Z",
  })
  updatedAt: Date;
}
