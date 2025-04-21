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
import { ErrorModel } from "@shared/error-model";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("sign-in")
  @UsePipes(ValidationPipe)
  async signIn(
    @Body() data: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, sessionId } = await this.authService.signIn(data);
    res.cookie("accessToken", accessToken, { httpOnly: true });
    res.cookie("sessionId", sessionId, { httpOnly: true });

    return {
      message: "Sign in success",
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
      return res.status(401).json(ErrorModel.REFRESH_TOKEN_EXPIRED);
    }
    res.cookie("accessToken", accessToken, { httpOnly: true });
    res.json({
      message: "Refresh success",
    });
  }
}
