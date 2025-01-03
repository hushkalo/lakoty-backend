import { Module } from "@nestjs/common";
import { UserService } from "./user.service";
import { AdminUserController } from "./admin.user.controller";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [AdminUserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
