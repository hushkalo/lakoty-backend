import { HttpException } from "@nestjs/common";
import { type CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { ValidationPipe } from "../pipes/validation.pipe";

export const paginationShape = {
  take: z.number().int().min(1).max(100).optional().describe("Page size"),
  skip: z.number().int().min(0).optional().describe("Records to skip"),
};

export const sortOrder = z.enum(["asc", "desc"]);

export const dtoPayload = (fields: string) =>
  z
    .record(z.string(), z.unknown())
    .describe(`JSON object validated by the admin API DTO. Fields: ${fields}`);

const errorText = (error: unknown): string => {
  if (error instanceof HttpException) {
    const response = error.getResponse();
    return typeof response === "string"
      ? response
      : JSON.stringify(response, null, 2);
  }
  return error instanceof Error ? error.message : JSON.stringify(error);
};

/** Runs a tool handler and maps its result or error to an MCP tool result. */
export async function runTool(
  handler: () => Promise<unknown>,
): Promise<CallToolResult> {
  try {
    const data = await handler();
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? null, null, 2) }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: "text", text: errorText(error) }],
    };
  }
}

/** Validates a payload with the same class-validator pipe the REST controllers use. */
export async function validateDto<T>(
  metatype: new (...args: unknown[]) => T,
  value: Record<string, unknown>,
): Promise<T> {
  await new ValidationPipe().transform(value as never, {
    type: "body",
    metatype,
  });
  return value as T;
}
