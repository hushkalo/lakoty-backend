import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AuthService } from "./auth.service";
import { Request } from "express";
import { EnvironmentVariables } from "../config/env.validation";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private readonly configService: ConfigService<EnvironmentVariables>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        JwtStrategy.extractJwtFromCookie,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: configService.get("JWT_SECRET"),
      ignoreExpiration: false,
    });
  }

  private static extractJwtFromCookie = (req: Request): string | null => {
    const accessToken = req?.cookies?.accessToken as string | undefined;
    if (!accessToken || accessToken === "") {
      return null;
    }
    return req.cookies.accessToken as string;
  };

  validate(payload: { sub: string }) {
    return this.authService.validateUserById(payload.sub);
  }
}
