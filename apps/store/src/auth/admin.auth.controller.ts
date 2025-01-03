import {
  Controller,
  Post,
  Body,
  Res,
  UseGuards,
  UsePipes,
  Get,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto, RegisterDto } from "./dto/create-auth.dto";
import { type Response } from "express";
import { JwtGuard } from "../guards/jwt.guard";
import { ValidationPipe } from "../pipes/validation.pipe";
import { Cookies } from "../decorators/cookies.decorator";
import { CookieDto } from "./dto/cookie.dto";
import { ECodeErrors } from "@shared/enums/code-errors.enum";

@Controller("admin/auth")
export class AdminAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("sing-in")
  @UsePipes(ValidationPipe)
  async singIn(
    @Body() data: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, sessionId } = await this.authService.signIn(data);
    res.cookie("accessToken", accessToken, { httpOnly: true });
    res.cookie("sessionId", sessionId, { httpOnly: true });

    return {
      message: "Sing in success",
    };
  }

  @Post("sing-up")
  @UsePipes(ValidationPipe)
  singUp(@Body() data: RegisterDto) {
    return this.authService.signUp(data);
  }

  @UseGuards(JwtGuard)
  @Post("logout")
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie("accessToken");
    res.clearCookie("sessionId");
    return {
      message: "Logout success",
    };
  }

  @Get("refresh")
  async refresh(
    @Cookies() cookies: CookieDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken } = await this.authService.refreshTokens(
      cookies.sessionId,
    );
    if (!accessToken) {
      res.clearCookie("accessToken");
      res.clearCookie("sessionId");
      return res.status(401).json({
        message: ECodeErrors.REFRESH_TOKEN_EXPIRED_MESSAGE,
        error_code: ECodeErrors.REFRESH_TOKEN_EXPIRED_CODE,
      });
    }
    res.cookie("accessToken", accessToken, { httpOnly: true });
    return {
      message: "Refresh success",
    };
  }
}
