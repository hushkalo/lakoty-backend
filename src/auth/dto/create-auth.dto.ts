import { ApiProperty } from "@nestjs/swagger";
import { CreateUserDto } from "../../user/dto/create-user.dto";
import { IsString, Length } from "class-validator";

export class LoginDto {
  @ApiProperty()
  @IsString()
  email: string;
  @ApiProperty()
  @IsString()
  password: string;
}

export class RegisterDto extends CreateUserDto {
  @ApiProperty()
  @IsString()
  @Length(7, 50)
  confirmPassword: string;
}
