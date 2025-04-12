import { s3 } from "$aws";
import { completeUploads } from "$upload";
import { STATUS_CODE } from "@std/http";
import { getSigner } from "../../../util/aws.ts";
import { INODES_BUCKET, UPLOAD_DISABLED_MSG } from "../../../util/consts.ts";
import {
  createFileNodesFromUploads,
  isValidUploadDirEntry,
} from "../../../util/inodes/create_file_node.ts";
import { getAppSettings } from "../../../util/kv/app_settings.ts";
import { getInodeById } from "../../../util/kv/inodes.ts";
import type { AppContext } from "../../../util/types.ts";

type ReqData = {
  uploads: s3.CompletedMultipartUpload[];
  dirId: string;
};

export default async function completeUploadHandler(ctx: AppContext) {
  const { user } = ctx.state;
  const { origin } = ctx.url;

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

  const { dirId, uploads } = reqData;
  const dirEntry = await getInodeById(dirId);

  if (!isValidUploadDirEntry(dirEntry, user)) {
    return ctx.respond(null, STATUS_CODE.NotFound);
  }

  const { completedUploads } = await completeUploads({
    uploads,
    bucket: INODES_BUCKET,
    signer: getSigner(),
  });

  const completedUploadsIds = await createFileNodesFromUploads(
    completedUploads,
    { dirEntry, dirId, user, origin },
  );

  return ctx.json(completedUploadsIds);
}

function isValidReqData(data: unknown): data is ReqData {
  const { uploads, dirId } = data as Partial<ReqData>;
  return typeof data === "object" &&
    typeof dirId === "string" &&
    Array.isArray(uploads) && uploads.every((upload) => {
      const {
        uploadId,
        s3Key,
        fileName,
        fileType,
        checksum,
        finishedParts,
      } = upload as Partial<s3.CompletedMultipartUpload>;
      return typeof s3Key === "string" &&
        typeof uploadId === "string" &&
        typeof fileName === "string" &&
        typeof fileType === "string" &&
        typeof checksum === "string" &&
        Array.isArray(finishedParts) &&
        typeof finishedParts[0].partNumber === "number" &&
        typeof finishedParts[0].etag === "string";
    });
}
