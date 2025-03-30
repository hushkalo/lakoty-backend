import { BadRequestException, Injectable, PipeTransform } from "@nestjs/common";
import { extname } from "path";
import { ErrorModel } from "../model/error.model";

@Injectable()
export class ValidationFileSizePipe implements PipeTransform {
  transform(value: Express.Multer.File | Express.Multer.File[]) {
    if (!value) {
      throw new BadRequestException(ErrorModel.FILE_NOT_FOUND);
    }
    const files = Array.isArray(value) ? value : [value];

    files.forEach((file) => {
      const ext = extname(file.originalname).toLowerCase();
      if (!ext || (ext !== ".jpg" && ext !== ".png" && ext !== ".jpeg")) {
        throw new BadRequestException(ErrorModel.NOT_SUPPORTED_FILE);
      }
      const fiveMb = 5 * Math.pow(1024, 2);
      if (file.size > fiveMb) {
        throw new BadRequestException(ErrorModel.BIG_SIZE_FILE);
      }
    });
    return value;
  }
}
