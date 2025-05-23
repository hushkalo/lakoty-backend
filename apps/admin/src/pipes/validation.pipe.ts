import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from "@nestjs/common";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";
import { ErrorModel } from "@shared/error-model";

@Injectable()
export class ValidationPipe implements PipeTransform {
  async transform(value: string, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }
    const object = plainToInstance<object, string>(metatype, value);
    const errors = await validate(object);
    if (errors.length > 0) {
      const errorsReason = errors.map((error) => {
        if (error.children && error.children.length > 0) {
          return {
            key: error.property,
            constraints: error.children.map((child) => ({
              index: child.property,
              values: child?.children.map((value) => ({
                key: value.property,
                constraints: value.constraints,
              })),
            })),
          };
        }
        return {
          key: error.property,
          constraints: error.constraints,
        };
      });
      throw new BadRequestException({
        ...ErrorModel.VALIDATION_FAILED,
        errorsReason,
      });
    }
    return value;
  }

  private toValidate(metatype: new (...args: unknown[]) => unknown): boolean {
    const types: Array<new (...args: unknown[]) => unknown> = [
      String,
      Boolean,
      Number,
      Array,
      Object,
    ];
    return !types.includes(metatype);
  }
}
