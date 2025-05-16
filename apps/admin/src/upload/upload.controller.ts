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
import {
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import {
  FilesUploadDto,
  FileUploadDto,
  UploadMultipleResponseDto,
  UploadResponseDto,
} from "./dto/response.dto";

@ApiTags("Upload")
@Controller("upload")
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @ApiOperation({ summary: "Upload file" })
  @ApiConsumes("multipart/form-data")
  @ApiCreatedResponse({
    description: "File uploaded successfully",
    type: UploadResponseDto,
  })
  @ApiBody({
    description: "Files to upload",
    type: FileUploadDto,
  })
  @Post("file")
  @UseInterceptors(FileInterceptor("file"))
  uploadFile(
    @UploadedFile(new ValidationFileSizePipe()) file: Express.Multer.File,
  ): Promise<UploadResponseDto> {
    return this.uploadService.uploadFile({ file });
  }

  @ApiOperation({ summary: "Upload files" })
  @ApiConsumes("multipart/form-data")
  @ApiCreatedResponse({
    description: "Files uploaded successfully",
    type: UploadMultipleResponseDto,
    isArray: true,
  })
  @ApiBody({
    description: "Files to upload",
    type: FilesUploadDto,
  })
  @Post("files")
  @UseInterceptors(FilesInterceptor("files"))
  uploadFiles(
    @UploadedFiles(new ValidationFileSizePipe()) files: Express.Multer.File[],
  ): Promise<UploadMultipleResponseDto[]> {
    return this.uploadService.uploadFiles({ files });
  }
}
