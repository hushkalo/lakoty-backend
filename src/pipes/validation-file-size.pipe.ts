import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from "@nestjs/common";
import { extname } from "path";
import { ECodeErrors } from "../enums/code-errors.enum";

@Injectable()
export class ValidationFileSizePipe implements PipeTransform {
  transform(value: Express.Multer.File, metadata: ArgumentMetadata) {
    if (!value) {
      throw new BadRequestException({
        error_code: ECodeErrors.FILE_NOT_FOUND_CODE,
        message: ECodeErrors.FILE_NOT_FOUND_MESSAGE,
      });
    }
    const ext = extname(value.originalname).toLowerCase();
    if (!ext || (ext !== ".jpg" && ext !== ".png" && ext !== ".jpeg")) {
      throw new BadRequestException({
        error_code: ECodeErrors.NOT_SUPPORTED_FILE_CODE,
        message: ECodeErrors.NOT_SUPPORTED_FILE_MESSAGE,
      });
    }
    const oneKb = Math.pow(1024, 2);
    if (value.size > oneKb) {
      throw new BadRequestException({
        error_code: ECodeErrors.BIG_SIZE_FILE_CODE,
        message: ECodeErrors.BIG_SIZE_FILE_MESSAGE,
      });
    }
    return value;
  }
}
