import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { JWT_CONFIG } from "../constants/constant";
import { AuthService } from "./auth.service";
import { Request } from "express";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        JwtStrategy.extractJwtFromCookie,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: JWT_CONFIG.secret,
      ignoreExpiration: false,
    });
  }

  private static extractJwtFromCookie(req: Request): string | null {
    if (
      !req.cookies ||
      !req.cookies.accessToken ||
      req.cookies.accessToken.length < 0
    ) {
      return null;
    }
    return req.cookies.accessToken;
  }

  validate(payload: any) {
    return this.authService.validateUserById(payload.sub);
  }
}
