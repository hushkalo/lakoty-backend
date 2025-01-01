import { appendFile } from "fs";
import { join } from "path";
import { isExistsDirectory } from "./is-exists-directory.util";
import {
  BUILD_IMAGES_DIRECTORY_PATH,
  TDirectoryName,
} from "../constants/constant";
import { asyncCreateDirectory } from "./async-create-directory.util";

export const asyncCreateImage = async (params: {
  file: Express.Multer.File;
  fileName: string;
  alias: string;
  type: TDirectoryName;
}): Promise<{
  message: string;
  params: {
    fileName: string;
    alias: string;
    type: TDirectoryName;
  };
}> => {
  const filePath = join(
    BUILD_IMAGES_DIRECTORY_PATH(params.type),
    params.alias,
    params.fileName,
  );
  const isExists = await isExistsDirectory(
    join(BUILD_IMAGES_DIRECTORY_PATH(params.type), params.alias),
  );
  if (!isExists) {
    await asyncCreateDirectory({
      directoryPath: BUILD_IMAGES_DIRECTORY_PATH(params.type),
      directoryName: params.alias,
    });
  }
  return new Promise((resolve, reject) => {
    appendFile(filePath, params.file.buffer, (err) => {
      if (err) {
        console.log("error", err);
        reject(err);
      } else {
        resolve({
          message: "File created!",
          params,
        });
      }
    });
  });
};
