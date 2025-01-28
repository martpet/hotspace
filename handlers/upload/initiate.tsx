import { initUploads, type UploadInitData } from "$upload";
import { STATUS_CODE } from "@std/http/status";
import {
  AWS_CREDENTIALS,
  AWS_REGION,
  INODES_BUCKET,
  SAVED_UPLOAD_EXPIRES,
} from "../../util/consts.ts";
import type { AppContext } from "../../util/types.ts";

type ReqData = UploadInitData[];

export default async function initiateUploadHandler(ctx: AppContext) {
  if (!ctx.state.user) {
    return ctx.respond(null, STATUS_CODE.Unauthorized);
  }

  const uploadsInitData = await ctx.req.json();

  if (!isValidReqData(uploadsInitData)) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  const result = await initUploads({
    uploadsInitData,
    region: AWS_REGION,
    bucket: INODES_BUCKET,
    credentials: AWS_CREDENTIALS,
    savedUploadExpiresIn: SAVED_UPLOAD_EXPIRES,
  });

  return ctx.json(result);
}

function isValidReqData(data: unknown): data is ReqData {
  return Array.isArray(data) &&
    data.every((item) => {
      const { fileType, numberOfParts, savedUpload } = item as Partial<
        UploadInitData
      >;
      return typeof fileType === "string" &&
        typeof numberOfParts === "number" &&
        (!savedUpload ||
          typeof savedUpload.uploadId === "string" &&
            typeof savedUpload.s3Key === "string" &&
            typeof savedUpload.createdOn === "number" &&
            Array.isArray(savedUpload.finishedParts));
    });
}
