import { type CompletedUpload } from "$aws";
import { completeUploads } from "$upload";
import { STATUS_CODE } from "@std/http";
import { ulid } from "@std/ulid";
import {
  AWS_CREDENTIALS,
  AWS_REGION,
  INODES_BUCKET,
} from "../../../util/consts.ts";
import { enqueue } from "../../../util/kv/enqueue.ts";
import {
  getDirNode,
  keys as inodesKeys,
  setInodeByDir,
} from "../../../util/kv/inodes.ts";
import { kv } from "../../../util/kv/kv.ts";
import {
  QueueMsgDeleteS3Objects,
} from "../../../util/kv/queue_handlers/delete_s3_objects.ts";
import { setUploadSize } from "../../../util/kv/upload_size.ts";
import type {
  AppContext,
  DirNode,
  FileNode,
  User,
} from "../../../util/types.ts";
import { parsePathname } from "../../../util/url.ts";

type ReqData = {
  uploads: CompletedUpload[];
  pathname: string;
};

export default async function completeUploadHandler(ctx: AppContext) {
  const { user } = ctx.state;

  if (!user) {
    return ctx.respond(null, STATUS_CODE.Unauthorized);
  }

  const reqData = await ctx.req.json();

  if (!isValidReqData(reqData)) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  const { uploads, pathname } = reqData;
  const { pathSegments } = parsePathname(pathname);

  let parentDirEntry = await getDirNode(pathSegments);

  if (!checkDirOwner(parentDirEntry, user)) {
    return ctx.respond(null, STATUS_CODE.Forbidden);
  }

  const { completedUploads } = await completeUploads({
    uploads,
    bucket: INODES_BUCKET,
    region: AWS_REGION,
    credentials: AWS_CREDENTIALS,
  });

  const completedIds = [];

  for (const upload of completedUploads) {
    const inode: FileNode = {
      id: ulid(),
      type: "file",
      fileType: upload.fileType,
      fileSize: upload.fileSize,
      s3Key: upload.s3Key,
      name: "",
      ownerId: user.id,
    };

    let i = 0;
    let res = { ok: false };

    while (!res.ok) {
      inode.name = encodeURIComponent(upload.fileName);

      if (i > 0) {
        inode.name += `-${i + 1}`;
        parentDirEntry = await getDirNode(pathSegments);
      }

      if (!checkDirOwner(parentDirEntry, user)) {
        await enqueue<QueueMsgDeleteS3Objects>({
          type: "delete-s3-objects",
          s3Keys: uploads.map((u) => u.s3Key),
          bucket: INODES_BUCKET,
        }).commit();
        return ctx.respond(null, STATUS_CODE.Forbidden);
      }

      const parentDirId = parentDirEntry.value.id;

      const atomic = kv.atomic();
      setInodeByDir({ parentDirId, inode, atomic });
      setUploadSize({ userId: user.id, size: upload.fileSize, atomic });
      atomic.check(parentDirEntry);
      atomic.check({
        key: inodesKeys.byDir(parentDirId, inode.name),
        versionstamp: null,
      });
      res = await atomic.commit();
      i++;
    }
    completedIds.push(upload.uploadId);
  }

  return ctx.json(completedIds);
}

function checkDirOwner(
  entry: Deno.KvEntryMaybe<DirNode>,
  user: User,
): entry is Deno.KvEntry<DirNode> {
  return entry.value?.ownerId === user.id;
}

function isValidReqData(data: unknown): data is ReqData {
  const { uploads, pathname } = data as Partial<ReqData>;
  return typeof data === "object" &&
    typeof pathname === "string" &&
    Array.isArray(uploads) && uploads.every((upload) => {
      const { uploadId, s3Key, fileName, fileType, checksum, finishedParts } =
        upload as Partial<CompletedUpload>;
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
