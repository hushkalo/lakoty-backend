import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from "@nestjs/common";
import { ECodeErrors } from "../enums/code-errors.enum";
import {
  CATEGORY_DIRECTORY_NAME,
  PRODUCT_DIRECTORY_NAME,
} from "../constants/constant";

@Injectable()
export class ValidationTypeQueryPipe implements PipeTransform {
  transform(value: string, metadata: ArgumentMetadata) {
    if (value !== CATEGORY_DIRECTORY_NAME && value !== PRODUCT_DIRECTORY_NAME) {
      throw new BadRequestException({
        error_code: ECodeErrors.NOT_SUPPORTED_TYPE_DIRECTORY_CODE,
        message: ECodeErrors.NOT_SUPPORTED_TYPE_DIRECTORY_MESSAGE,
      });
    }
    return value;
  }
}
