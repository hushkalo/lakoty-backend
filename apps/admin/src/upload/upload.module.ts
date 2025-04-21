import { Logger, Module } from "@nestjs/common";
import { UploadController } from "./upload.controller";
import { UploadService } from "./upload.service";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { EnvironmentVariablesForAdmin } from "@shared/configuration";

@Module({
  imports: [
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
  controllers: [UploadController],
  providers: [UploadService, Logger],
})
export class UploadModule {}
