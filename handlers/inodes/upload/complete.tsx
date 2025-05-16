import { s3 } from "$aws";
import { completeUploads } from "$upload";
import { STATUS_CODE } from "@std/http";
import { getSigner } from "../../../util/aws.ts";
import { INODES_BUCKET } from "../../../util/consts.ts";
import {
  createFileNodesFromUploads,
  isValidUploadDirEntry,
} from "../../../util/inodes/create_file_node.ts";
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

  const reqData = await ctx.req.json();

  if (!isValidReqData(reqData)) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  const { dirId, uploads } = reqData;
  const dirEntry = await getInodeById(dirId);

  if (!isValidUploadDirEntry(dirEntry, user)) {
    return ctx.respond(null, STATUS_CODE.NotFound);
  }

  const { completedUploads, failedUploads } = await completeUploads({
    uploads,
    bucket: INODES_BUCKET,
    signer: getSigner(),
  });

  const completedIds = await createFileNodesFromUploads(
    completedUploads,
    { dirEntry, dirId, user, origin },
  );

  const failedIds = failedUploads.map((u) => u.uploadId);

  return ctx.json({ completedIds, failedIds });
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
        mimeType,
        checksum,
        finishedParts,
      } = upload as Partial<s3.CompletedMultipartUpload>;
      return typeof s3Key === "string" &&
        typeof uploadId === "string" &&
        typeof fileName === "string" &&
        (typeof mimeType === "string" || mimeType === null) &&
        typeof checksum === "string" &&
        Array.isArray(finishedParts) &&
        typeof finishedParts[0].partNumber === "number" &&
        typeof finishedParts[0].etag === "string";
    });
}
