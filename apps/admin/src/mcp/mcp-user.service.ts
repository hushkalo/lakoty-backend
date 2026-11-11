import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService, User } from "@libs/prisma-client";
import { EnvironmentVariablesForAdmin } from "@shared/configuration";

/** Resolves the admin user on whose behalf MCP write operations are performed. */
@Injectable()
export class McpUserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService<EnvironmentVariablesForAdmin>,
  ) {}

  /** The OAuth-authenticated user if known, otherwise the MCP_USER_EMAIL user. */
  async getActingUser(userId?: string): Promise<User> {
    if (userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new BadRequestException(`MCP user ${userId} does not exist`);
      }
      return user;
    }
    const email = this.configService.get<string>("MCP_USER_EMAIL");
    if (!email) {
      throw new BadRequestException(
        "MCP_USER_EMAIL is not configured for the admin app",
      );
    }
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new BadRequestException(`MCP user ${email} does not exist`);
    }
    return user;
  }
}
