import { join } from "path";

export const MAIN_STATIC_DIRECTORY_NAME = "static";
export const MAIN_STATIC_DIRECTORY_PATH = join(
  process.cwd(),
  MAIN_STATIC_DIRECTORY_NAME,
);

export const PRODUCT_DIRECTORY_NAME = "product";
export const CATEGORY_DIRECTORY_NAME = "category";

export type TDirectoryName =
  | typeof PRODUCT_DIRECTORY_NAME
  | typeof CATEGORY_DIRECTORY_NAME;
export const BUILD_IMAGES_DIRECTORY_PATH = (
  directoryName: TDirectoryName,
): string => join(MAIN_STATIC_DIRECTORY_PATH, directoryName);

export const JWT_CONFIG = {
  secret: process.env.JWT_SECRET,
  accessTokenExpiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN,
  refreshTokenExpiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN,
};

export const HOUR_IN_MILLISECONDS = 1000 * 60 * 60;
export const HALF_HOUR_IN_MILLISECONDS = HOUR_IN_MILLISECONDS / 2;

export const MANAGER_ID = Number(process.env.MANAGER_ID);
export const SOURCE_ID = Number(process.env.SOURCE_ID);
export const KEY_CRM_API = process.env.KEY_CRM_API;
export const CRM_API_KEY = process.env.CRM_API_KEY;
