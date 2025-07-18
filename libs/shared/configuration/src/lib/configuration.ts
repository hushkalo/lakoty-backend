export const configuration = () => ({
  NODE_ENV: process.env["NODE_ENV"],
  BASE_PORT: process.env["BASE_PORT"],
  CORS_ORIGIN: process.env["CORS_ORIGIN"],
  BASE_URL: process.env["BASE_URL"],
  POSTGRES_USER: process.env["POSTGRES_USER"],
  POSTGRES_PASSWORD: process.env["POSTGRES_PASSWORD"],
  POSTGRES_DATABASE: process.env["POSTGRES_DATABASE"],
  POSTGRES_HOST: process.env["POSTGRES_HOST"],
  JWT_SECRET: process.env["JWT_SECRET"],
  JWT_ACCESS_TOKEN_EXPIRES_IN: process.env["JWT_ACCESS_TOKEN_EXPIRES_IN"],
  JWT_REFRESH_TOKEN_EXPIRES_IN: process.env["JWT_REFRESH_TOKEN_EXPIRES_IN"],
  BODY_LIMIT: process.env["BODY_LIMIT"],
  MANAGER_ID: Number(process.env["MANAGER_ID"]),
  SOURCE_ID: Number(process.env["SOURCE_ID"]),
  CRM_API_URL: process.env["CRM_API_URL"],
  CRM_API_KEY: process.env["CRM_API_KEY"],
  HOUR_IN_MILLISECONDS: Number(process.env["HOUR_IN_MILLISECONDS"]),
  DATABASE_URL: process.env["DATABASE_URL"],
  NOVA_POST_API_URL: process.env["NOVA_POST_API_URL"],
  NOVA_POST_API_KEY: process.env["NOVA_POST_API_KEY"],
  MONOBANK_API_URL: process.env["MONOBANK_API_URL"],
  MONOBANK_API_KEY: process.env["MONOBANK_API_KEY"],
  CLIENT_URL: process.env["CLIENT_URL"],
  REDIS_HOST: process.env["REDIS_HOST"],
  REDIS_PORT: process.env["REDIS_PORT"],
  PREPAY_ID: process.env["PREPAY_ID"],
  POSTPAY_ID: process.env["POSTPAY_ID"],
});
