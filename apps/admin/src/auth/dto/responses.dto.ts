import { ApiProperty } from "@nestjs/swagger";

export class LoginResponseDto {
  @ApiProperty({
    description: "Access token for the user",
    example: "Sign in success",
  })
  message: string;
}

export class LogoutResponseDto {
  @ApiProperty({
    description: "Logout message",
    example: "Logout success",
  })
  message: string;
}

export class RefreshResponseDto {
  @ApiProperty({
    description: "Logout message",
    example: "Refresh token success",
  })
  message: string;
}

export class RegisterResponseDto {
  @ApiProperty({ description: "User ID", example: "cljqu47yf0000qspk3rfx4n1z" })
  id: string;

  @ApiProperty({
    description: "User email address",
    example: "user@example.com",
  })
  email: string;

  @ApiProperty({
    description: "User first name",
    example: "John",
    nullable: true,
  })
  firstName: string | null;

  @ApiProperty({
    description: "User last name",
    example: "Doe",
    nullable: true,
  })
  lastName: string | null;

  @ApiProperty({
    description: "User phone number",
    example: "+1234567890",
    nullable: true,
  })
  phoneNumber: string | null;

  @ApiProperty({
    description: "URL to user profile image",
    example: "https://example.com/image.jpg",
    nullable: true,
  })
  imageUrl: string | null;

  @ApiProperty({
    description: "User role ID",
    example: "cljqu47yf0001qspk3rfx4n1z",
  })
  roleId: string;

  @ApiProperty({ description: "Account creation timestamp" })
  createdAt: Date;

  @ApiProperty({ description: "Account last update timestamp" })
  updatedAt: Date;
}

export class CookieDto {
  accessToken: string;
  sessionId: string;
}
