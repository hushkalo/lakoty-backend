import { Logger, Module } from "@nestjs/common";
import { UploadController } from "./upload.controller";
import { UploadService } from "./upload.service";
import { HttpModule } from "@nestjs/axios";
import { CRM_API_KEY, CRM_API_URL } from "../configuration";

@Module({
  imports: [
    HttpModule.register({
      baseURL: CRM_API_URL,
      headers: { Authorization: `Bearer ${CRM_API_KEY}` },
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService, Logger],
})
export class UploadModule {}
