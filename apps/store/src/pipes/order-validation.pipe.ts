import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from "@nestjs/common";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";

@Injectable()
export class OrderValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }
    const object = plainToInstance(metatype, value);
    const errors = await validate(object, {
      whitelist: true,
      forbidUnknownValues: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      const formattedErrors = this.formatErrors(errors);
      throw new BadRequestException(formattedErrors);
    }

    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private formatErrors(errors: any[]): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    errors.forEach((error) => {
      if (error.constraints) {
        result[error.property] = Object.values(error.constraints);
      }
      // For nested validation errors
      if (error.children && error.children.length > 0) {
        const childErrors = this.formatErrors(error.children);
        Object.entries(childErrors).forEach(([key, value]) => {
          result[`${error.property}.${key}`] = value;
        });
      }
    });
    return result;
  }
}
