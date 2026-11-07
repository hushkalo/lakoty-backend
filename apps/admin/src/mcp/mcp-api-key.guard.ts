import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { type Request } from "express";
import { createHash, timingSafeEqual } from "crypto";
import { EnvironmentVariablesForAdmin } from "@shared/configuration";
import { ErrorModel } from "@shared/error-model";

const digest = (value: string) => createHash("sha256").update(value).digest();

@Injectable()
export class McpApiKeyGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService<EnvironmentVariablesForAdmin>,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const apiKey = this.configService.get<string>("MCP_API_KEY");
    const request = context.switchToHttp().getRequest<Request>();
    const [scheme, token] = (request.headers.authorization ?? "").split(" ");

    if (
      !apiKey ||
      scheme !== "Bearer" ||
      !token ||
      !timingSafeEqual(digest(token), digest(apiKey))
    ) {
      throw new UnauthorizedException(ErrorModel.USER_UNAUTHORIZED);
    }
    return true;
  }
}
