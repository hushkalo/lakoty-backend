import { Logger, Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AdminAuthController } from "./admin.auth.controller";
import { UserModule } from "../user/user.module";
import { PrismaModule } from "../prisma/prisma.module";
import { JwtModule } from "@nestjs/jwt";
import { JwtStrategy } from "./jwt.strategy";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { EnvironmentVariables } from "../config/env.validation";

@Module({
  controllers: [AdminAuthController],
  providers: [AuthService, JwtStrategy, Logger],
  imports: [
    PrismaModule,
    UserModule,
    PassportModule.register({ defaultStrategy: "jwt", session: false }),
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvironmentVariables>) => ({
        global: true,
        secret: configService.get("JWT_SECRET"),
        signOptions: {
          expiresIn: configService.get("JWT_ACCESS_TOKEN_EXPIRES_IN"),
        },
      }),
    }),
  ],
  exports: [AuthService],
})
export class AuthModule {}
