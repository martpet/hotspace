import { s3 } from "$aws";
import { initUploads, type UploadInitData } from "$upload";
import { DAY } from "@std/datetime";
import { HEADER } from "@std/http";
import { STATUS_CODE } from "@std/http/status";
import { getSigner } from "../../../util/aws.ts";
import {
  AWS_CREDENTIALS,
  AWS_REGION,
  INODES_BUCKET,
  SAVED_UPLOAD_EXPIRES,
} from "../../../util/consts.ts";
import type { AppContext } from "../../../util/types.ts";

type ReqData = UploadInitData[];

export default async function initiateUploadHandler(ctx: AppContext) {
  if (!ctx.state.user) {
    return ctx.respond(null, STATUS_CODE.Unauthorized);
  }

  const uploads = await ctx.req.json();

  if (!isValidReqData(uploads)) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  const headersFn = (upload: UploadInitData) => {
    const fileName = encodeURIComponent(upload.fileName);
    return new Headers({
      [HEADER.ContentType]: upload.fileType,
      [HEADER.ContentDisposition]: `inline; filename*=UTF-8''${fileName}`,
      [HEADER.CacheControl]: `public, max-age=${DAY * 365 / 1000}, immutable`,
    });
  };

  const result = await initUploads({
    uploads,
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
  return Array.isArray(data) &&
    data.every((item) => {
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
