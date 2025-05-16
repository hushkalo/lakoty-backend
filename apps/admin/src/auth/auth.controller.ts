import {
  Body,
  Controller,
  Get,
  Post,
  Res,
  UseGuards,
  UsePipes,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto, RegisterDto } from "./dto/create-auth.dto";
import { type Response } from "express";
import { JwtGuard } from "../guards/jwt.guard";
import { ValidationPipe } from "../pipes/validation.pipe";
import { Cookies } from "../decorators/cookies.decorator";
import { CookieDto } from "./dto/cookie.dto";
import { AppError, AppErrorValidation, ErrorModel } from "@shared/error-model";
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import {
  LoginResponseDto,
  LogoutResponseDto,
  RefreshResponseDto,
  RegisterResponseDto,
} from "./dto/responses.dto";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("sign-in")
  @UsePipes(ValidationPipe)
  @ApiOperation({ summary: "Sign in user" })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: "Sign in successful",
    type: LoginResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "Unauthorized - Invalid credentials",
    type: AppError,
    example: ErrorModel.USER_INVALID_CREDENTIALS,
  })
  @ApiNotFoundResponse({
    description: "User not found",
    type: AppError,
    example: ErrorModel.USER_DOES_NOT_EXIST,
  })
  @ApiBadRequestResponse({
    description: "Bad request - Validation failed",
    type: AppErrorValidation,
    example: {
      ...ErrorModel.VALIDATION_FAILED,
      errorReason: [
        {
          key: "email",
          constraints: {
            isEmail: "email must be an email",
            isString: "email must be a string",
          },
        },
        {
          key: "password",
          constraints: {
            isString: "password must be a string",
          },
        },
      ],
    },
  })
  async signIn(
    @Body() data: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    const { accessToken, sessionId } = await this.authService.signIn(data);
    res.cookie("accessToken", accessToken, { httpOnly: true });
    res.cookie("sessionId", sessionId, { httpOnly: true });

    return {
      message: "Sign in success",
    };
  }

  @Post("sign-up")
  @UsePipes(ValidationPipe)
  @ApiOperation({ summary: "Register new user" })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: "User successfully created",
    type: RegisterResponseDto,
  })
  @ApiConflictResponse({
    description: "User already exists",
    type: AppError,
    example: ErrorModel.USER_ALREADY_EXISTS,
  })
  @ApiBadRequestResponse({
    description: "Bad request - Validation failed",
    type: AppErrorValidation,
    example: {
      ...ErrorModel.VALIDATION_FAILED,
      errorsReason: [
        {
          key: "email",
          constraints: {
            isEmail: "email must be an email",
            isString: "email must be a string",
          },
        },
        {
          key: "password",
          constraints: {
            isString: "password must be a string",
          },
        },
        {
          key: "confirmPassword",
          constraints: {
            isString: "confirmPassword must be a string",
            length:
              "confirmPassword must be longer than or equal to 7 characters",
            Match: "confirmPassword must match password",
          },
        },
      ],
    },
  })
  singUp(@Body() data: RegisterDto): Promise<RegisterResponseDto> {
    return this.authService.signUp(data);
  }

  @UseGuards(JwtGuard)
  @Post("logout")
  @ApiOperation({ summary: "Logout user" })
  @ApiResponse({
    status: 200,
    description: "Logout successful",
    type: LogoutResponseDto,
  })
  logout(@Res({ passthrough: true }) res: Response): LogoutResponseDto {
    res.clearCookie("accessToken");
    res.clearCookie("sessionId");
    return {
      message: "Logout success",
    };
  }

  @Get("refresh")
  @ApiOperation({ summary: "Refresh access token" })
  @ApiResponse({
    status: 200,
    description: "Token refresh successful",
    type: RefreshResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "Unauthorized - Invalid refresh token",
    type: AppError,
    example: ErrorModel.REFRESH_TOKEN_EXPIRED,
  })
  @ApiInternalServerErrorResponse({
    description: "Internal server error - Refresh token expired",
    type: AppError,
    example: ErrorModel.INTERNAL_SERVER_ERROR,
  })
  async refresh(
    @Cookies() cookies: CookieDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RefreshResponseDto> {
    const { accessToken } = await this.authService.refreshTokens(
      cookies.sessionId,
    );
    if (!accessToken) {
      res.clearCookie("accessToken");
      res.clearCookie("sessionId");
      res.status(401).json(ErrorModel.REFRESH_TOKEN_EXPIRED);
      return;
    }
    res.cookie("accessToken", accessToken, { httpOnly: true });
    res.json({
      message: "Refresh success",
    });
  }
}
