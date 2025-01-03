import { join } from "path";
import {
  MAIN_STATIC_DIRECTORY_NAME,
  TDirectoryName,
} from "@shared/constants";

export const createStaticUrlUtil = (params: {
  type: TDirectoryName;
  alias: string;
  fileName: string;
}): string => {
  const baseUrl = process.env.BASE_URL || "http://localhost:3000";
  const staticUrl = new URL(
    join(
      MAIN_STATIC_DIRECTORY_NAME,
      params.type,
      params.alias,
      params.fileName,
    ),
    baseUrl,
  );
  return staticUrl.href;
};
