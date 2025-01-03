import {
  Controller,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ValidationFileSizePipe } from "../pipes/validation-file-size.pipe";
import { UploadService } from "./upload.service";
import { ValidationQueryPipe } from "../pipes/validation-query.pipe";
import { ValidationTypeQueryPipe } from "./validation-type-query.pipe";
import { TDirectoryName } from "../constants/constant";

@Controller("admin/upload")
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post("upload-image")
  @UseInterceptors(FileInterceptor("image"))
  uploadFile(
    @UploadedFile(new ValidationFileSizePipe()) file: Express.Multer.File,
    @Query("alias", ValidationQueryPipe) alias: string,
    @Query("type", ValidationQueryPipe, ValidationTypeQueryPipe)
    type: TDirectoryName,
  ) {
    return this.uploadService.uploadFile({ file, alias, type });
  }
}
