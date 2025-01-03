import {
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { type Request } from "express";
import { ECodeErrors } from "../enums/code-errors.enum";

export const Cookies = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const { cookies } = request;
    if (!cookies.sessionId) {
      throw new ForbiddenException({
        message: ECodeErrors.USER_INVALID_CREDENTIALS_MESSAGE,
        error_code: ECodeErrors.USER_INVALID_CREDENTIALS_CODE,
      });
    }
    return cookies;
  },
);
