import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { ValidationFileSizePipe } from "../pipes/validation-file-size.pipe";
import { UploadService } from "./upload.service";

@Controller("upload")
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post("file")
  @UseInterceptors(FileInterceptor("file"))
  uploadFile(
    @UploadedFile(new ValidationFileSizePipe()) file: Express.Multer.File,
  ) {
    return this.uploadService.uploadFile({ file });
  }

  @Post("files")
  @UseInterceptors(FilesInterceptor("files"))
  uploadFiles(
    @UploadedFiles(new ValidationFileSizePipe()) files: Express.Multer.File[],
  ) {
    return this.uploadService.uploadFiles({ files });
  }
}
