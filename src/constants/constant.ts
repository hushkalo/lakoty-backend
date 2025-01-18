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
