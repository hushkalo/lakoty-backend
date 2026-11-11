import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { type Request, type Response } from "express";
import { createHash, timingSafeEqual } from "crypto";
import { EnvironmentVariablesForAdmin } from "@shared/configuration";
import { ErrorModel } from "@shared/error-model";
import { McpOAuthService } from "./oauth/mcp-oauth.service";

const digest = (value: string) => createHash("sha256").update(value).digest();

/** Request augmented by McpApiKeyGuard with the admin user an OAuth token belongs to. */
export type McpRequest = Request & { mcpUserId?: string };

/**
 * Accepts `Authorization: Bearer <token>` where the token is either the static
 * MCP_API_KEY (acts as MCP_USER_EMAIL) or an OAuth access token issued by
 * McpOAuthService (acts as the user who signed in).
 */
@Injectable()
export class McpApiKeyGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService<EnvironmentVariablesForAdmin>,
    private readonly oauth: McpOAuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<McpRequest>();
    const [scheme, token] = (request.headers.authorization ?? "").split(" ");

    if (scheme === "Bearer" && token) {
      const apiKey = this.configService.get<string>("MCP_API_KEY");
      if (apiKey && timingSafeEqual(digest(token), digest(apiKey))) {
        return true;
      }
      const userId = this.oauth.enabled
        ? await this.oauth.userIdFromAccessToken(token)
        : undefined;
      if (userId) {
        request.mcpUserId = userId;
        return true;
      }
    }

    if (this.oauth.enabled) {
      // Lets OAuth clients discover the authorization server (RFC 9728).
      context
        .switchToHttp()
        .getResponse<Response>()
        .setHeader(
          "WWW-Authenticate",
          `Bearer resource_metadata="${this.oauth.resourceMetadataUrl}"`,
        );
    }
    throw new UnauthorizedException(ErrorModel.USER_UNAUTHORIZED);
  }
}
