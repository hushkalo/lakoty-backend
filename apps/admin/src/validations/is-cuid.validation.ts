import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";
import { isCuid } from "cuid";

export function IsCUID(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "isCUID",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, _args: ValidationArguments) {
          return typeof value === "string" && isCuid(value);
        },
        defaultMessage(_args: ValidationArguments) {
          return "Invalid CUID";
        },
      },
    });
  };
}
