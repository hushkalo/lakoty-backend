import { Logger, Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AdminAuthController } from "./admin.auth.controller";
import { UserModule } from "../user/user.module";
import { PrismaModule } from "../prisma/prisma.module";
import { JwtModule } from "@nestjs/jwt";
import { JWT_CONFIG } from "../constants/constant";
import { JwtStrategy } from "./jwt.strategy";
import { PassportModule } from "@nestjs/passport";

@Module({
  controllers: [AdminAuthController],
  providers: [AuthService, JwtStrategy, Logger],
  imports: [
    PrismaModule,
    UserModule,
    PassportModule.register({ defaultStrategy: "jwt", session: false }),
    JwtModule.register({
      global: true,
      secret: JWT_CONFIG.secret,
      signOptions: { expiresIn: JWT_CONFIG.accessTokenExpiresIn },
    }),
  ],
  exports: [AuthService],
})
export class AuthModule {}
