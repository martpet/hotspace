import { completeUploads, type UploadCompleteData } from "$upload";
import { STATUS_CODE } from "@std/http";
import {
  AWS_CREDENTIALS,
  AWS_REGION,
  INODES_BUCKET,
} from "../../util/consts.ts";
import type { AppContext } from "../../util/types.ts";

type ReqData = UploadCompleteData[];

export default async function completeUploadHandler(ctx: AppContext) {
  if (!ctx.state.user) {
    return ctx.respond(null, STATUS_CODE.Unauthorized);
  }

  const uploads = await ctx.req.json();

  if (!isValidReqData(uploads)) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  const { completedIds, uploadedSize } = await completeUploads({
    uploads,
    bucket: INODES_BUCKET,
    region: AWS_REGION,
    credentials: AWS_CREDENTIALS,
  });

  return ctx.json(completedIds);
}

function isValidReqData(data: unknown): data is ReqData {
  return Array.isArray(data) && data.every((item) => {
    const { uploadId, s3Key, checksum, finishedParts } = item as Partial<
      UploadCompleteData
    >;
    return typeof s3Key === "string" &&
      typeof uploadId === "string" &&
      typeof checksum === "string" &&
      Array.isArray(finishedParts) &&
      typeof finishedParts[0].partNumber === "number" &&
      typeof finishedParts[0].etag === "string";
  });
}
