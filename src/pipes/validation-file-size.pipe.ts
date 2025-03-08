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
  transform(
    value: Express.Multer.File | Express.Multer.File[],
    metadata: ArgumentMetadata,
  ) {
    if (!value) {
      throw new BadRequestException({
        error_code: ECodeErrors.FILE_NOT_FOUND_CODE,
        message: ECodeErrors.FILE_NOT_FOUND_MESSAGE,
      });
    }
    const files = Array.isArray(value) ? value : [value];

    files.forEach((file) => {
      const ext = extname(file.originalname).toLowerCase();
      if (!ext || (ext !== ".jpg" && ext !== ".png" && ext !== ".jpeg")) {
        throw new BadRequestException({
          error_code: ECodeErrors.NOT_SUPPORTED_FILE_CODE,
          message: ECodeErrors.NOT_SUPPORTED_FILE_MESSAGE,
        });
      }
      const fiveMb = 5 * Math.pow(1024, 2);
      if (file.size > fiveMb) {
        throw new BadRequestException({
          error_code: ECodeErrors.BIG_SIZE_FILE_CODE,
          message: ECodeErrors.BIG_SIZE_FILE_MESSAGE,
        });
      }
    });
    return value;
  }
}
