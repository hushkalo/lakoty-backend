import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { AxiosError } from "axios";
import FormData from "form-data";
import { type TKeyCRMAddFile } from "@shared/types";
import { ErrorModel } from "@shared/error-model";
import {
  UploadMultipleResponseDto,
  UploadResponseDto,
} from "./dto/response.dto";

@Injectable()
export class UploadService {
  constructor(
    private readonly httpService: HttpService,
    private readonly logger: Logger,
  ) {}
  SERVICE: string = UploadService.name;

  async uploadFile(params: {
    file: Express.Multer.File;
  }): Promise<UploadResponseDto> {
    const { file } = params;
    try {
      const formData = new FormData();
      formData.append("file", file.buffer, file.originalname);
      const response = await this.httpService.axiosRef.post<TKeyCRMAddFile>(
        "/storage/upload",
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
        },
      );
      return {
        url: `https://lakotiy.api.keycrm.app/file-storage/thumbnails/lakotiy${response.data.directory}${response.data.file_name}`,
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        this.logger.error(error.message, error.stack, this.SERVICE);
        throw new InternalServerErrorException(
          ErrorModel.UPLOAD_FAILED_WITH_PROBLEM_CRM,
        );
      }
      this.logger.error(error, this.SERVICE);
      throw new InternalServerErrorException(ErrorModel.UPLOAD_FAILED);
    }
  }

  async uploadFiles(params: {
    files: Express.Multer.File[];
  }): Promise<UploadMultipleResponseDto[]> {
    const { files } = params;
    console.log(
      files.map((file) => (file.size / Math.pow(1024, 2)).toFixed(2) + " MB"),
    );
    try {
      const imagePromises = files.map(async (file, index) => {
        const formData = new FormData();
        formData.append("file", file.buffer, file.originalname);
        const response = await this.httpService.axiosRef.post<TKeyCRMAddFile>(
          "/storage/upload",
          formData,
          {
            headers: {
              ...formData.getHeaders(),
            },
          },
        );
        return {
          order: index,
          url: `https://lakotiy.api.keycrm.app/file-storage/thumbnails/lakotiy${response.data.directory}${response.data.file_name}`,
        };
      });
      return await Promise.all(imagePromises);
    } catch (error) {
      if (error instanceof AxiosError) {
        this.logger.error(error.message, error.stack, this.SERVICE);
        throw new InternalServerErrorException("Failed to upload files");
      }
      this.logger.error(error, this.SERVICE);
      throw new InternalServerErrorException("Failed to upload files");
    }
  }
}
