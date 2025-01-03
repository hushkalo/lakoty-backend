import { access } from "fs";

export const isExistsDirectory = (path: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    access(path, (err) => {
      if (err) {
        if (err.code !== "ENOENT") {
          reject(err);
        }
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
};
