import { plainToInstance } from "class-transformer";
import {
  IsEnum,
  IsNumber,
  IsString,
  Max,
  Min,
  validateSync,
} from "class-validator";
import { instance as logger } from "@shared/logger";

export enum Environment {
  Development = "development",
  Production = "production",
  Test = "test",
  Provision = "provision",
}

export class EnvironmentVariablesForStore {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsNumber()
  @Min(0)
  @Max(65535)
  BASE_PORT: number;

  @IsString()
  CORS_ORIGIN: string;

  @IsString()
  BASE_URL: string;

  @IsString()
  POSTGRES_USER: string;

  @IsString()
  POSTGRES_PASSWORD: string;

  @IsString()
  POSTGRES_DATABASE: string;

  @IsString()
  POSTGRES_HOST: string;

  @IsString()
  JWT_SECRET: string;

  @IsString()
  JWT_ACCESS_TOKEN_EXPIRES_IN: string;

  @IsString()
  JWT_REFRESH_TOKEN_EXPIRES_IN: string;

  @IsString()
  BODY_LIMIT: string;

  @IsNumber()
  MANAGER_ID: number;

  @IsNumber()
  SOURCE_ID: number;

  @IsString()
  CRM_API_URL: string;

  @IsString()
  CRM_API_KEY: string;

  @IsNumber()
  HOUR_IN_MILLISECONDS: number;

  @IsString()
  DATABASE_URL: string;

  @IsString()
  NOVA_POST_API_KEY: string;
  @IsString()
  NOVA_POST_API_URL: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(
    EnvironmentVariablesForStore,
    config,
    {
      enableImplicitConversion: true,
    },
  );
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  logger.debug("Configuration is OK...");
  logger.debug("NODE_ENV: " + validatedConfig.NODE_ENV);
  logger.debug("BASE_PORT: " + validatedConfig.BASE_URL);
  logger.debug("DATABASE_URL: " + validatedConfig.DATABASE_URL);
  return validatedConfig;
}
