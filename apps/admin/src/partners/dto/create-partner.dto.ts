import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString, IsUrl, IsUUID, Length } from "class-validator";

export class CreatePartnerDto {
  @ApiProperty()
  @Length(3, 15)
  @IsString()
  name: string;

  @ApiProperty()
  @IsUUID()
  apiKey: string;

  @ApiProperty()
  @IsUrl()
  apiUrl: string;

  @ApiProperty()
  @IsNumber()
  managerId: number;

  @ApiProperty()
  @IsNumber()
  sourceId: number;

  @ApiProperty()
  @IsNumber()
  postPayId: number;

  @ApiProperty()
  @IsNumber()
  prePayId: number;

  @ApiProperty()
  @IsNumber()
  deliveryServiceId: number;
}
