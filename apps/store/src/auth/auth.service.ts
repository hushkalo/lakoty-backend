import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { LoginDto, RegisterDto } from "./dto/create-auth.dto";
import { UserService } from "../user/user.service";
import { type User, type UserSession } from "@prisma/client";
import { ECodeErrors } from "@shared/enums/code-errors.enum";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import { LoginResponseDto } from "./dto/responses.dto";
import { JWT_CONFIG } from "@shared/constants";
import { comparePassword } from "../utils/bcrypt.util";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
  ) {}
  SERVICE: string = UserService.name;

  async signIn(data: LoginDto): Promise<LoginResponseDto> {
    const user = await this.validateUser(data);
    const session = await this.createSession(user);
    this.logger.log(
      `Creating session for user - ${user.email}, session - ${session.id}`,
      this.SERVICE,
    );
    return {
      accessToken: await this.jwtService.signAsync(
        { sub: user.id },
        {
          expiresIn: JWT_CONFIG.accessTokenExpiresIn,
        },
      ),
      sessionId: session.id,
    };
  }

  async signUp(data: RegisterDto): Promise<Omit<User, "password">> {
    const user = await this.usersService.findOne({
      where: {
        email: data.email,
      },
    });
    if (user) {
      this.logger.error(
        `${ECodeErrors.USER_ALREADY_EXISTS_MESSAGE} - ${data.email}`,
        this.SERVICE,
      );
      throw new BadRequestException({
        error_code: ECodeErrors.USER_ALREADY_EXISTS_CODE,
        message: ECodeErrors.USER_ALREADY_EXISTS_MESSAGE,
      });
    }
    if (data.password !== data.confirmPassword) {
      this.logger.error(
        `${ECodeErrors.USER_PASSWORD_NOT_MATCH_MESSAGE} - ${data.email}`,
        this.SERVICE,
      );
      throw new BadRequestException({
        error_code: ECodeErrors.USER_PASSWORD_NOT_MATCH_CODE,
        message: ECodeErrors.USER_PASSWORD_NOT_MATCH_MESSAGE,
      });
    }
    const { confirmPassword, ...rest } = data;
    return this.usersService.create(rest);
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

  private async validateUser(data: LoginDto): Promise<Omit<User, "password">> {
    const user = await this.usersService.findOne({
      where: {
        email: data.email,
      },
    });
    if (!user) {
      this.logger.error(
        `${ECodeErrors.USER_DOES_NOT_EXIST_MESSAGE} - ${data.email}`,
        this.SERVICE,
      );
      throw new BadRequestException({
        error_code: ECodeErrors.USER_DOES_NOT_EXIST_CODE,
        message: ECodeErrors.USER_DOES_NOT_EXIST_MESSAGE,
      });
    }
    const isPasswordMatch = await comparePassword({
      password: data.password,
      hashedPassword: user.password,
    });
    if (!isPasswordMatch) {
      this.logger.error(
        `${ECodeErrors.USER_PASSWORD_NOT_MATCH_MESSAGE} - ${data.email}`,
        this.SERVICE,
      );
      throw new BadRequestException({
        // make loggers
        error_code: ECodeErrors.USER_INVALID_CREDENTIALS_CODE,
        message: ECodeErrors.USER_INVALID_CREDENTIALS_MESSAGE,
      });
    }
    const { password, ...result } = user;
    return result;
  }

  private async createSession(
    user: Omit<User, "password">,
  ): Promise<UserSession> {
    return this.prisma.userSession.create({
      data: {
        refreshToken: await this.jwtService.signAsync(
          { sub: user.id },
          {
            expiresIn: JWT_CONFIG.refreshTokenExpiresIn,
          },
        ),
        userId: user.id,
      },
    });
  }

  async refreshTokens(
    sessionId: string | undefined,
  ): Promise<Omit<LoginResponseDto, "sessionId">> {
    const session = await this.prisma.userSession.findUnique({
      where: {
        id: sessionId,
      },
    });
    if (!session) {
      this.logger.error(
        `${ECodeErrors.SESSION_NOT_FOUND_MESSAGE} - ${sessionId}`,
        this.SERVICE,
      );
      throw new BadRequestException({
        error_code: ECodeErrors.SESSION_NOT_FOUND_CODE,
        message: ECodeErrors.SESSION_NOT_FOUND_MESSAGE,
      });
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
            expiresIn: JWT_CONFIG.accessTokenExpiresIn,
          },
        ),
      };
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        this.logger.error(
          `${ECodeErrors.REFRESH_TOKEN_EXPIRED_MESSAGE} - ${sessionId}`,
          this.SERVICE,
        );
        await this.clearSession(sessionId);
        return {
          accessToken: null,
        };
      }

      this.logger.error("Error while refreshing tokens", this.SERVICE, error);
      throw new InternalServerErrorException();
    }
  }
  private clearSession(sessionId: string) {
    return this.prisma.userSession.delete({
      where: {
        id: sessionId,
      },
    });
  }
}
