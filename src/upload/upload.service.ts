import { Injectable } from "@nestjs/common";
import { type TDirectoryName } from "../constants/constant";
import { basename, extname } from "path";
import { asyncCreateImage } from "../utils/async-create-image.util";
import { createStaticUrlUtil } from "../utils/create-static-url.util";
import { transliteration } from "../utils/transliteration.util";

@Injectable()
export class UploadService {
  async uploadFile(params: {
    file: Express.Multer.File;
    alias: string;
    type: TDirectoryName;
  }) {
    const fileExt = extname(params.file.originalname);
    const fileNameWithoutExt = transliteration(
      basename(params.file.originalname, fileExt),
    );
    const fileName = `${fileNameWithoutExt}-${Date.now()}${fileExt.toLowerCase()}`;
    const uploadPath = await asyncCreateImage({
      file: params.file,
      fileName,
      alias: params.alias,
      type: params.type,
    });
    return { url: createStaticUrlUtil(uploadPath.params) };
  }
}
