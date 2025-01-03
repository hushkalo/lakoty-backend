import { mkdir } from "fs";
import { join } from "path";

export const asyncCreateDirectory = async (params: {
  directoryPath: string;
  directoryName: string;
}) => {
  return new Promise((resolve, reject) => {
    mkdir(
      join(params.directoryPath, params.directoryName),
      { recursive: true },
      (err) => {
        if (err) {
          console.error("error", err);
          reject(err);
        } else {
          resolve("Directory created");
        }
      },
    );
  });
};
