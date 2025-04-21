import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, Length } from "class-validator";

export class CreateUserDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @Length(7, 50)
  password: string;

  @ApiProperty({ required: false })
  @IsString()
  @Length(3, 15)
  firstName: string;

  @ApiProperty({ required: false })
  @Length(3, 15)
  lastName: string;

  @IsString()
  @Length(10, 13)
  @ApiProperty({ required: false })
  phoneNumber: string;

  @ApiProperty()
  @IsString()
  roleId: string;
}
