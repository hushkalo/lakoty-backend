require("dotenv").config();
import { instance } from "./logger/winston.logger";

export const CONFIGURATION_NODE_ENV = process.env.NODE_ENV;
export const JWT_CONFIG = {
  secret: process.env.JWT_SECRET,
  accessTokenExpiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN,
  refreshTokenExpiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN,
};

export const HOUR_IN_MILLISECONDS = Number(process.env.HOUR_IN_MILLISECONDS);
export const HALF_HOUR_IN_MILLISECONDS = HOUR_IN_MILLISECONDS / 2;

export const MANAGER_ID = Number(process.env.MANAGER_ID);
export const SOURCE_ID = Number(process.env.SOURCE_ID);
export const KEY_CRM_API = process.env.KEY_CRM_API;
export const CRM_API_KEY = process.env.CRM_API_KEY;
export const CORS_ORIGIN = process.env.CORS_ORIGIN;
export const BASE_PORT = process.env.BASE_PORT || 3000;

export function validateConfiguration() {
  instance.log({
    level: "debug",
    message: "Checking configuration...",
  });

  checkVariable("NODE_ENV", CONFIGURATION_NODE_ENV, true);
  checkVariable("PORT", process.env.BASE_PORT);
  checkVariable("JWT_SECRET", JWT_CONFIG.secret);
  checkVariable("JWT_ACCESS_TOKEN_EXPIRES_IN", JWT_CONFIG.accessTokenExpiresIn);
  checkVariable(
    "JWT_REFRESH_TOKEN_EXPIRES_IN",
    JWT_CONFIG.refreshTokenExpiresIn,
  );
  checkVariable("MANAGER_ID", MANAGER_ID);
  checkVariable("SOURCE_ID", SOURCE_ID);
  checkVariable("KEY_CRM_API", KEY_CRM_API);
  checkVariable("CRM_API_KEY", CRM_API_KEY);
  checkVariable("CORS_ORIGIN", CORS_ORIGIN);
  checkVariable("BASE_PORT", process.env.BASE_PORT);
  checkVariable("BASE_URL", process.env.BASE_URL);
  checkVariable("POSTGRES_USER", process.env.POSTGRES_USER);
  checkVariable("POSTGRES_PASSWORD", process.env.POSTGRES_PASSWORD);
  checkVariable("POSTGRES_DATABASE", process.env.POSTGRES_DATABASE);
  checkVariable("POSTGRES_HOST", process.env.POSTGRES_HOST);
  checkVariable("BODY_LIMIT", process.env.BODY_LIMIT);
  checkVariable("DATABASE_URL", process.env.DATABASE_URL, true);
  checkVariable("HOUR_IN_MILLISECONDS", process.env.HOUR_IN_MILLISECONDS);
  checkVariable("HALF_HOUR_IN_MILLISECONDS", HALF_HOUR_IN_MILLISECONDS);
  instance.log({
    level: "debug",
    message: "Configuration is OK...",
  });
}

function checkVariable(
  name: string,
  value: string | number | undefined | boolean | string[],
  showValue = false,
) {
  if (value) {
    if (showValue) {
      instance.log({
        level: "debug",
        message: `${name} is set: ${value}`,
      });
    }
  } else {
    instance.log({
      level: "error",
      message: `[${name}] is not set`,
    });
    throw new Error(`[${name}] is not set`);
  }
}

export function getCorsOptions() {
  if (
    CONFIGURATION_NODE_ENV == "development" ||
    CONFIGURATION_NODE_ENV == "stage"
  ) {
    return {
      methods: "*",
      origin: ["http://localhost:5173", "http://localhost:4173"],
      credentials: true,
    };
  }
  if (CONFIGURATION_NODE_ENV == "production") {
    return {
      methods: "POST",
      origin: [CORS_ORIGIN],
      credentials: true,
      preflightContinue: false,
      optionsSuccessStatus: 204,
    };
  }
}
