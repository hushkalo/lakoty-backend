import { ApiProperty } from "@nestjs/swagger";
import { PartnerDto } from "./partner.dto";

export class ResponseAllPartnerDto {
  @ApiProperty({
    description: "Array of partner objects",
    type: [PartnerDto],
  })
  data: PartnerDto[];

  @ApiProperty({
    description: "Number of items returned in current page",
    example: 10,
    minimum: 0,
  })
  to: number;

  @ApiProperty({
    description: "Total number of partners available",
    example: 25,
    minimum: 0,
  })
  total: number;
}
