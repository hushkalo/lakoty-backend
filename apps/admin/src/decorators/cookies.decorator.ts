import {
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { type Request } from "express";
import { ErrorModel } from "@shared/error-model";

export const Cookies = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const { cookies } = request;
    if (!cookies.sessionId) {
      throw new ForbiddenException(ErrorModel.USER_INVALID_CREDENTIALS);
    }
    return cookies;
  },
);
