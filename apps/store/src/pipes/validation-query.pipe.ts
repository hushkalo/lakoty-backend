import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from "@nestjs/common";
import { ECodeErrors } from "@shared/enums/code-errors.enum";

@Injectable()
export class ValidationQueryPipe implements PipeTransform {
  transform(value: string | undefined, metadata: ArgumentMetadata) {
    if (!value) {
      throw new BadRequestException({
        error_code: ECodeErrors.REQUIRE_QUERY_PARAM_CODE,
        message: `${ECodeErrors.REQUIRE_QUERY_PARAM_MESSAGE} ${metadata.data}`,
      });
    }
    return value;
  }
}
