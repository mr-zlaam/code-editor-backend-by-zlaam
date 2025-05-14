/* eslint-disable camelcase */
import { v2 as cloudinary } from "cloudinary";
import fs from "node:fs";
import envConfig from "../../config/env.config";
import { throwError } from "../../util/globalUtil/throwError.util";
import reshttp from "reshttp";
import logger from "../../util/globalUtil/logger.util";
cloudinary.config({
  cloud_name: envConfig.CLOUDINARY_NAME,
  api_key: envConfig.CLOUDINARY_API_KEY,
  api_secret: envConfig.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (
  localFilePath: string,
  fileName: string,
  format: string,
) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "raw",
      filename_override: fileName,
      folder: "b2b",
      format: format,
    });
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error: unknown) {
    fs.unlinkSync(localFilePath);
    if (error instanceof Error) throw { status: 500, message: error.message };
    else {
      logger.info(`Error while uploading files`, error);
      throwError(
        reshttp.internalServerErrorCode,
        `Error while uploading files:: ${error as string}`,
      );
    }
  }
};
const deleteFromCloudinary = async (publicId: string) => {
  try {
    if (!publicId) {
      throwError(reshttp.notFoundCode, reshttp.notFoundMessage);
      logger.warn("File not found on file storage");
    }
    return (await cloudinary.uploader.destroy(publicId, {
      resource_type: "raw",
    })) as { result: string };
  } catch (error: unknown) {
    if (error instanceof Error) throw { status: 500, message: error.message };
    else
      throwError(
        reshttp.internalServerErrorCode,
        `Error while uploading files:: ${error as string}`,
      );
  }
};
export { uploadOnCloudinary, deleteFromCloudinary };
