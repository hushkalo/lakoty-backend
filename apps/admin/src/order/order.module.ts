import { Logger, Module } from "@nestjs/common";
import { OrderService } from "./order.service";
import { OrderController } from "./order.controller";
import { PrismaModule } from "@libs/prisma-client";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { EnvironmentVariablesForAdmin } from "@shared/configuration";

@Module({
  imports: [
    PrismaModule,
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (
        configService: ConfigService<EnvironmentVariablesForAdmin>,
      ) => ({
        baseURL: configService.get("CRM_API_URL"),
        headers: {
          Authorization: `Bearer ${configService.get("CRM_API_KEY")}`,
        },
      }),
    }),
  ],
  controllers: [OrderController],
  providers: [OrderService, Logger],
  exports: [OrderService],
})
export class OrderModule {}
