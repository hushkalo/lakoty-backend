import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { LoginDto, RegisterDto } from "./dto/create-auth.dto";
import { UserService } from "../user/user.service";
import {
  type User,
  type UserSession,
  PrismaService,
} from "@libs/prisma-client";
import { JwtService } from "@nestjs/jwt";
import { CookieDto } from "./dto/responses.dto";
import { comparePassword } from "../utils/bcrypt.util";
import { ConfigService } from "@nestjs/config";
import { EnvironmentVariablesForAdmin } from "@shared/configuration";
import { ErrorModel } from "@shared/error-model";

@Injectable()
export class AuthService {
  SERVICE: string = UserService.name;

  constructor(
    private readonly usersService: UserService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
    private readonly configService: ConfigService<EnvironmentVariablesForAdmin>,
  ) {}

  async signIn(data: LoginDto): Promise<CookieDto> {
    const user = await this.validateUser(data);
    try {
      const session = await this.createSession(user);
      this.logger.log(
        `Creating session for user - ${user.email}, session - ${session.id}`,
        this.SERVICE,
      );
      return {
        accessToken: await this.jwtService.signAsync(
          { sub: user.id },
          {
            expiresIn: this.configService.get("JWT_ACCESS_TOKEN_EXPIRES_IN"),
          },
        ),
        sessionId: session.id,
      };
    } catch (error) {
      this.logger.error(
        `${ErrorModel.SESSION_CREATE_FAILED.message} - ${user.email}`,
        this.SERVICE,
        error,
      );
      throw new InternalServerErrorException(ErrorModel.INTERNAL_SERVER_ERROR);
    }
  }

  async signUp(data: RegisterDto): Promise<Omit<User, "password">> {
    const user = await this.usersService.findOne({
      where: {
        email: data.email,
      },
    });
    if (user) {
      this.logger.error(
        `${ErrorModel.USER_ALREADY_EXISTS.message} - ${data.email}`,
        this.SERVICE,
      );
      throw new ConflictException(ErrorModel.USER_ALREADY_EXISTS);
    }
    return this.usersService.create(user);
  }

  validateUserById(id: string): Promise<Omit<User, "password">> {
    return this.usersService.findOne({
      where: {
        id,
      },
      include: {
        role: {
          omit: {
            id: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      omit: { password: true },
    });
  }

  async refreshTokens(
    sessionId: string | undefined,
  ): Promise<Omit<CookieDto, "sessionId">> {
    const session = await this.prisma.userSession.findUnique({
      where: {
        id: sessionId,
      },
    });
    if (!session) {
      this.logger.error(
        `${ErrorModel.SESSION_NOT_FOUND.message} - ${sessionId}`,
        this.SERVICE,
      );
      return {
        accessToken: null,
      };
    }
    try {
      const refreshToken = await this.jwtService.verifyAsync<{ sub: string }>(
        session.refreshToken,
      );
      const user = await this.validateUserById(refreshToken.sub);
      return {
        accessToken: await this.jwtService.signAsync(
          { sub: user.id },
          {
            expiresIn: this.configService.get("JWT_ACCESS_TOKEN_EXPIRES_IN"),
          },
        ),
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "TokenExpiredError") {
          this.logger.error(
            `${ErrorModel.REFRESH_TOKEN_EXPIRED.message} - ${sessionId}`,
            this.SERVICE,
          );
          await this.clearSession(sessionId);
          return {
            accessToken: null,
          };
        }
      }

      this.logger.error("Error while refreshing tokens", this.SERVICE, error);
      throw new InternalServerErrorException(ErrorModel.INTERNAL_SERVER_ERROR);
    }
  }

  private async validateUser(data: LoginDto): Promise<Omit<User, "password">> {
    const user = await this.usersService.findOne({
      where: {
        email: data.email,
      },
    });
    if (!user) {
      this.logger.error(
        `${ErrorModel.USER_DOES_NOT_EXIST.message} - ${data.email}`,
        this.SERVICE,
      );
      throw new NotFoundException(ErrorModel.USER_DOES_NOT_EXIST);
    }
    const { password, ...userData } = user;
    const isPasswordMatch = await comparePassword({
      password: data.password,
      hashedPassword: password,
    });
    if (!isPasswordMatch) {
      this.logger.error(
        `${ErrorModel.USER_PASSWORD_NOT_MATCH.message} - ${data.email}`,
        this.SERVICE,
      );
      throw new UnauthorizedException(ErrorModel.USER_INVALID_CREDENTIALS);
    }

    return userData;
  }

  private async createSession(
    user: Omit<User, "password">,
  ): Promise<UserSession> {
    return this.prisma.userSession.create({
      data: {
        refreshToken: await this.jwtService.signAsync(
          { sub: user.id },
          {
            expiresIn: this.configService.get("JWT_REFRESH_TOKEN_EXPIRES_IN"),
          },
        ),
        userId: user.id,
      },
    });
  }

  private clearSession(sessionId: string) {
    return this.prisma.userSession.delete({
      where: {
        id: sessionId,
      },
    });
  }
}
