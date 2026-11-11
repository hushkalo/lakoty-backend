import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import {
  Router,
  urlencoded,
  type Request,
  type RequestHandler,
  type Response,
} from "express";
import { rateLimit } from "express-rate-limit";
import { createHmac, randomUUID } from "crypto";
import {
  getOAuthProtectedResourceMetadataUrl,
  mcpAuthRouter,
} from "@modelcontextprotocol/sdk/server/auth/router.js";
import {
  type AuthorizationParams,
  type OAuthServerProvider,
} from "@modelcontextprotocol/sdk/server/auth/provider.js";
import { type OAuthRegisteredClientsStore } from "@modelcontextprotocol/sdk/server/auth/clients.js";
import {
  InvalidGrantError,
  InvalidTokenError,
} from "@modelcontextprotocol/sdk/server/auth/errors.js";
import { type AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import {
  type OAuthClientInformationFull,
  type OAuthTokens,
} from "@modelcontextprotocol/sdk/shared/auth.js";
import { PrismaService } from "@libs/prisma-client";
import { EnvironmentVariablesForAdmin } from "@shared/configuration";
import { comparePassword } from "../../utils/bcrypt.util";
import { renderLoginPage } from "./login-page";

const LOGIN_PATH = "/oauth/login";
const LOGIN_REQUEST_TTL = 10 * 60;
const CODE_TTL = 5 * 60;
const ACCESS_TOKEN_TTL = 60 * 60;
const REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60;

type TokenType = "client" | "login_request" | "code" | "access" | "refresh";

type ClientPayload = Omit<
  OAuthClientInformationFull,
  "client_id" | "client_secret" | "client_secret_expires_at"
>;

type LoginRequestPayload = {
  client_id: string;
  redirect_uri: string;
  code_challenge: string;
  state?: string;
  scopes?: string[];
};

type CodePayload = {
  client_id: string;
  redirect_uri: string;
  code_challenge: string;
  sub: string;
  scopes?: string[];
};

type TokenPayload = { client_id: string; sub: string; scopes?: string[] };

type JwtClaims = { typ: TokenType; iat: number; exp: number; jti: string };

/** Fields set by this server or by JWT signing, never part of signed client metadata. */
const NON_METADATA_FIELDS = new Set([
  "client_id",
  "client_id_issued_at",
  "client_secret",
  "client_secret_expires_at",
  "typ",
  "iat",
  "iss",
]);

const clientMetadata = (client: object): ClientPayload =>
  Object.fromEntries(
    Object.entries(client).filter(([key]) => !NON_METADATA_FIELDS.has(key)),
  ) as ClientPayload;

/**
 * Stateless OAuth 2.1 authorization server for MCP clients that cannot send a static
 * API key (ChatGPT). Users sign in with their admin email/password; every artifact
 * (registered client ids, authorization codes, access and refresh tokens) is a JWT
 * signed with a key derived from JWT_SECRET, so no database tables are needed.
 */
@Injectable()
export class McpOAuthService implements OAuthServerProvider {
  private readonly logger = new Logger(McpOAuthService.name);
  private readonly signingKey: string;
  private readonly publicUrl?: URL;
  /** Authorization codes already exchanged, kept until they expire (single instance). */
  private readonly usedCodes = new Map<string, number>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    configService: ConfigService<EnvironmentVariablesForAdmin>,
  ) {
    this.signingKey = createHmac(
      "sha256",
      configService.get<string>("JWT_SECRET"),
    )
      .update("lakoty-mcp-oauth")
      .digest("hex");
    const publicUrl = configService.get<string>("MCP_PUBLIC_URL");
    this.publicUrl = publicUrl ? new URL("/", publicUrl) : undefined;
  }

  get enabled(): boolean {
    return !!this.publicUrl;
  }

  /** The MCP endpoint URL, used as the token audience (RFC 8707 resource). */
  get resourceUrl(): URL {
    return new URL("/api/admin/mcp", this.publicUrl);
  }

  get resourceMetadataUrl(): string {
    return getOAuthProtectedResourceMetadataUrl(this.resourceUrl);
  }

  /** Express router with the OAuth endpoints; must be mounted at the app root. */
  router(): RequestHandler {
    const router = Router();
    router.use(
      mcpAuthRouter({
        provider: this,
        issuerUrl: this.publicUrl,
        resourceServerUrl: this.resourceUrl,
        resourceName: "Lakotiy Shop Admin",
      }),
    );
    router.post(
      LOGIN_PATH,
      rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 20,
        skipSuccessfulRequests: true,
        validate: { xForwardedForHeader: false },
      }),
      urlencoded({ extended: false }),
      (req, res, next) => {
        this.handleLogin(req, res).catch(next);
      },
    );
    return router;
  }

  get clientsStore(): OAuthRegisteredClientsStore {
    return {
      getClient: (clientId) => this.getClient(clientId),
      registerClient: (client) => this.registerClient(client),
    };
  }

  async authorize(
    client: OAuthClientInformationFull,
    params: AuthorizationParams,
    res: Response,
  ): Promise<void> {
    const request = await this.sign<LoginRequestPayload>(
      "login_request",
      {
        client_id: client.client_id,
        redirect_uri: params.redirectUri,
        code_challenge: params.codeChallenge,
        state: params.state,
        scopes: params.scopes,
      },
      LOGIN_REQUEST_TTL,
    );
    this.sendLoginPage(res, 200, {
      request,
      clientName: this.clientName(client),
    });
  }

  async challengeForAuthorizationCode(
    client: OAuthClientInformationFull,
    authorizationCode: string,
  ): Promise<string> {
    return (await this.verifyCode(client, authorizationCode)).code_challenge;
  }

  async exchangeAuthorizationCode(
    client: OAuthClientInformationFull,
    authorizationCode: string,
    _codeVerifier?: string,
    redirectUri?: string,
  ): Promise<OAuthTokens> {
    const code = await this.verifyCode(client, authorizationCode);
    if (redirectUri && redirectUri !== code.redirect_uri) {
      throw new InvalidGrantError("redirect_uri does not match");
    }
    this.markCodeUsed(code.jti, code.exp);
    return this.issueTokens(client.client_id, code.sub, code.scopes);
  }

  async exchangeRefreshToken(
    client: OAuthClientInformationFull,
    refreshToken: string,
  ): Promise<OAuthTokens> {
    const payload = await this.verify<TokenPayload>(
      "refresh",
      refreshToken,
    ).catch(() => {
      throw new InvalidGrantError("Invalid refresh token");
    });
    if (payload.client_id !== client.client_id) {
      throw new InvalidGrantError("Refresh token was issued to another client");
    }
    await this.assertUserExists(payload.sub);
    return this.issueTokens(client.client_id, payload.sub, payload.scopes);
  }

  /** Admin user id of a valid OAuth access token, or undefined. */
  async userIdFromAccessToken(token: string): Promise<string | undefined> {
    try {
      return (await this.verifyAccess(token)).sub;
    } catch {
      return undefined;
    }
  }

  async verifyAccessToken(token: string): Promise<AuthInfo> {
    const payload = await this.verifyAccess(token).catch(() => {
      throw new InvalidTokenError("Invalid access token");
    });
    return {
      token,
      clientId: payload.client_id,
      scopes: payload.scopes ?? [],
      expiresAt: payload.exp,
      resource: this.resourceUrl,
      extra: { userId: payload.sub },
    };
  }

  private verifyAccess(token: string): Promise<TokenPayload & JwtClaims> {
    return this.verify<TokenPayload>("access", token, {
      audience: this.resourceUrl.href,
    });
  }

  private async handleLogin(req: Request, res: Response) {
    const { request, email, password } = req.body as Record<string, string>;
    let login: LoginRequestPayload;
    let client: OAuthClientInformationFull | undefined;
    try {
      login = await this.verify<LoginRequestPayload>("login_request", request);
      client = await this.getClient(login.client_id);
    } catch {
      // ignored: handled below
    }
    if (!login || !client) {
      res
        .status(400)
        .type("text/plain")
        .send("Сесія входу застаріла. Почніть підключення знову.");
      return;
    }

    const user = email
      ? await this.prisma.user.findUnique({ where: { email } })
      : null;
    const passwordMatches =
      !!user &&
      !!password &&
      (await comparePassword({ password, hashedPassword: user.password }));
    if (!passwordMatches) {
      this.logger.warn(`MCP OAuth login failed for ${email}`);
      this.sendLoginPage(res, 401, {
        request,
        clientName: this.clientName(client),
        email,
        error: "Невірний email або пароль.",
      });
      return;
    }

    const code = await this.sign<CodePayload>(
      "code",
      {
        client_id: login.client_id,
        redirect_uri: login.redirect_uri,
        code_challenge: login.code_challenge,
        sub: user.id,
        scopes: login.scopes,
      },
      CODE_TTL,
      randomUUID(),
    );
    this.logger.log(
      `MCP OAuth access granted to ${this.clientName(client)} by ${user.email}`,
    );
    const redirect = new URL(login.redirect_uri);
    redirect.searchParams.set("code", code);
    if (login.state) redirect.searchParams.set("state", login.state);
    res.redirect(302, redirect.href);
  }

  private sendLoginPage(
    res: Response,
    status: number,
    params: Omit<Parameters<typeof renderLoginPage>[0], "action">,
  ) {
    res
      .status(status)
      .set({
        "Cache-Control": "no-store",
        "X-Frame-Options": "DENY",
        "Content-Security-Policy":
          "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'",
      })
      .type("html")
      .send(
        renderLoginPage({
          ...params,
          action: new URL(LOGIN_PATH, this.publicUrl).href,
        }),
      );
  }

  /** Client ids are signed client metadata, so registration needs no storage. */
  private async registerClient(
    client: Omit<
      OAuthClientInformationFull,
      "client_id" | "client_id_issued_at"
    >,
  ): Promise<OAuthClientInformationFull> {
    const metadata = clientMetadata(client);
    const clientId = await this.sign<ClientPayload>("client", metadata);
    return this.toClientInformation(clientId, metadata);
  }

  private async getClient(
    clientId: string,
  ): Promise<OAuthClientInformationFull | undefined> {
    try {
      const payload = await this.verify<ClientPayload>("client", clientId);
      return this.toClientInformation(clientId, clientMetadata(payload));
    } catch {
      return undefined;
    }
  }

  private toClientInformation(
    clientId: string,
    metadata: ClientPayload,
  ): OAuthClientInformationFull {
    const isPublic = metadata.token_endpoint_auth_method === "none";
    return {
      ...metadata,
      client_id: clientId,
      // Confidential clients get a secret derived from their id; it never expires.
      client_secret: isPublic ? undefined : this.hmac(`secret:${clientId}`),
      client_secret_expires_at: isPublic ? undefined : 0,
    };
  }

  private clientName(client: OAuthClientInformationFull): string {
    return client.client_name || "MCP-клієнт";
  }

  private async verifyCode(
    client: OAuthClientInformationFull,
    authorizationCode: string,
  ) {
    const code = await this.verify<CodePayload>(
      "code",
      authorizationCode,
    ).catch(() => {
      throw new InvalidGrantError("Invalid authorization code");
    });
    if (code.client_id !== client.client_id) {
      throw new InvalidGrantError(
        "Authorization code was issued to another client",
      );
    }
    if (this.usedCodes.has(code.jti)) {
      throw new InvalidGrantError("Authorization code has already been used");
    }
    return code;
  }

  private markCodeUsed(jti: string, exp: number) {
    const now = Math.floor(Date.now() / 1000);
    for (const [id, expiresAt] of this.usedCodes) {
      if (expiresAt < now) this.usedCodes.delete(id);
    }
    this.usedCodes.set(jti, exp);
  }

  private async issueTokens(
    clientId: string,
    userId: string,
    scopes?: string[],
  ): Promise<OAuthTokens> {
    const payload = { client_id: clientId, sub: userId, scopes };
    return {
      access_token: await this.sign<TokenPayload>(
        "access",
        payload,
        ACCESS_TOKEN_TTL,
        undefined,
        this.resourceUrl.href,
      ),
      token_type: "Bearer",
      expires_in: ACCESS_TOKEN_TTL,
      refresh_token: await this.sign<TokenPayload>(
        "refresh",
        payload,
        REFRESH_TOKEN_TTL,
      ),
      scope: scopes?.join(" "),
    };
  }

  private async assertUserExists(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) throw new InvalidGrantError("User no longer exists");
  }

  private sign<T extends object>(
    typ: TokenType,
    payload: T,
    expiresIn?: number,
    jwtid?: string,
    audience?: string,
  ): Promise<string> {
    return this.jwtService.signAsync(
      { ...payload, typ },
      {
        secret: this.signingKey,
        issuer: this.publicUrl.href,
        ...(expiresIn ? { expiresIn } : {}),
        ...(jwtid ? { jwtid } : {}),
        ...(audience ? { audience } : {}),
      },
    );
  }

  private async verify<T extends object>(
    typ: TokenType,
    token: string,
    options: { audience?: string } = {},
  ): Promise<T & JwtClaims> {
    const payload = await this.jwtService.verifyAsync<T & JwtClaims>(
      token ?? "",
      {
        secret: this.signingKey,
        issuer: this.publicUrl.href,
        ...options,
      },
    );
    if (payload.typ !== typ) throw new Error(`Expected ${typ} token`);
    return payload;
  }

  private hmac(value: string): string {
    return createHmac("sha256", this.signingKey).update(value).digest("hex");
  }
}
