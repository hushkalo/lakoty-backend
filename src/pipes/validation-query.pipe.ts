import { BadRequestException, Injectable, PipeTransform } from "@nestjs/common";
import { ErrorModel } from "../model/error.model";

@Injectable()
export class ValidationQueryPipe implements PipeTransform {
  transform(value: string | undefined) {
    if (!value) {
      throw new BadRequestException(ErrorModel.REQUIRE_QUERY_PARAM);
    }
    return value;
  }
}
