import { ApiProperty } from "@nestjs/swagger";

export class PartnerDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  apiKey: string;

  @ApiProperty()
  apiUrl: string;

  @ApiProperty()
  managerId: number;

  @ApiProperty()
  sourceId: number;

  @ApiProperty()
  postPayId: number;

  @ApiProperty()
  prePayId: number;

  @ApiProperty()
  deliveryServiceId: number;
}
