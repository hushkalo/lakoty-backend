import { ApiProperty } from "@nestjs/swagger";
import { CreateUserDto } from "../../user/dto/create-user.dto";
import { IsEmail, IsString, Length } from "class-validator";
import { Match } from "../../validations/match.validation";

export class LoginDto {
  @ApiProperty({
    description: "User email address",
    example: "user@example.com",
  })
  @IsString()
  @IsEmail()
  email: string;
  @ApiProperty({
    description: "User password",
    example: "Password123!",
    minLength: 7,
    maxLength: 50,
  })
  @IsString()
  password: string;
}

export class RegisterDto extends CreateUserDto {
  @ApiProperty({
    description: "Password confirmation that must match the password",
    example: "Password123!",
    minLength: 7,
    maxLength: 50,
  })
  @IsString()
  @Match("password")
  @Length(7, 50)
  confirmPassword: string;
}
