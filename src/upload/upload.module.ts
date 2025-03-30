import { Logger, Module } from "@nestjs/common";
import { UploadController } from "./upload.controller";
import { UploadService } from "./upload.service";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { EnvironmentVariables } from "../config/env.validation";

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvironmentVariables>) => ({
        baseURL: configService.get("CRM_API_URL"),
        headers: {
          Authorization: `Bearer ${configService.get("CRM_API_KEY")}`,
        },
      }),
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService, Logger],
})
export class UploadModule {}
