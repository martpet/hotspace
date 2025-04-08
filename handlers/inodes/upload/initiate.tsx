import { s3 } from "$aws";
import { initUploads, type UploadInitData } from "$upload";
import { DAY } from "@std/datetime";
import { STATUS_CODE } from "@std/http";
import { HEADER } from "@std/http/unstable-header";
import { getSigner } from "../../../util/aws.ts";
import {
  AWS_CREDENTIALS,
  AWS_REGION,
  INODES_BUCKET,
  SAVED_UPLOAD_EXPIRES,
  UPLOAD_DISABLED_MSG,
} from "../../../util/consts.ts";
import { getAppSettings } from "../../../util/kv/app_settings.ts";
import type { AppContext } from "../../../util/types.ts";

interface ReqData {
  uploadsInitData: UploadInitData[];
}

export default async function initiateUploadHandler(ctx: AppContext) {
  const { user } = ctx.state;

  if (!user) {
    return ctx.respond(null, STATUS_CODE.Unauthorized);
  }

  const { isUploadEnabled } = (await getAppSettings("eventual")).value || {};

  if (!isUploadEnabled) {
    return ctx.respond(UPLOAD_DISABLED_MSG, STATUS_CODE.ServiceUnavailable);
  }

  const reqData = await ctx.req.json();

  if (!isValidReqData(reqData)) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  const { uploadsInitData } = reqData;

  const headersFn = (upload: UploadInitData) => {
    const fileName = encodeURIComponent(upload.fileName);
    return new Headers({
      [HEADER.ContentType]: upload.fileType,
      [HEADER.ContentDisposition]: `inline; filename*=UTF-8''${fileName}`,
      [HEADER.CacheControl]: `public, max-age=${DAY * 365 / 1000}, immutable`,
    });
  };

  const result = await initUploads({
    uploadsInitData,
    region: AWS_REGION,
    bucket: INODES_BUCKET,
    credentials: AWS_CREDENTIALS,
    signer: getSigner(),
    savedUploadExpiresIn: SAVED_UPLOAD_EXPIRES,
    s3Endpoint: s3.ACCELERATED_ENDPOINT,
    headersFn,
  });

  return ctx.json(result);
}

function isValidReqData(data: unknown): data is ReqData {
  const { uploadsInitData } = data as ReqData;
  return typeof data === "object" &&
    Array.isArray(uploadsInitData) &&
    uploadsInitData.every((item) => {
      const { fileType, fileName, numberOfParts, savedUpload } =
        item as Partial<UploadInitData>;
      return typeof fileType === "string" &&
        typeof fileName === "string" &&
        typeof numberOfParts === "number" &&
        (!savedUpload ||
          typeof savedUpload.uploadId === "string" &&
            typeof savedUpload.s3Key === "string" &&
            typeof savedUpload.createdOn === "number" &&
            Array.isArray(savedUpload.finishedParts));
    });
}
