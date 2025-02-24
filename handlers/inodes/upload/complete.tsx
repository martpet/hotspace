import { type CompletedUpload } from "$aws";
import { completeUploads } from "$upload";
import { parsePathname } from "$util";
import { STATUS_CODE } from "@std/http";
import { ulid } from "@std/ulid";
import { getSigner } from "../../../util/aws.ts";
import { INODES_BUCKET } from "../../../util/consts.ts";
import { enqueue } from "../../../util/kv/enqueue.ts";
import {
  getDirByPath,
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
  const path = parsePathname(pathname);

  if (path.isRoot) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  let parentDirEntry = await getDirByPath(path.segments);

  if (!checkParentDir(parentDirEntry, user)) {
    return ctx.respond(null, STATUS_CODE.Forbidden);
  }

  const { completedUploads } = await completeUploads({
    uploads,
    bucket: INODES_BUCKET,
    signer: getSigner(),
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

    let commit = { ok: false };
    let i = 0;

    while (!commit.ok) {
      inode.name = encodeURIComponent(upload.fileName);

      if (i > 0) {
        inode.name += `-${i + 1}`;
        parentDirEntry = await getDirByPath(path.segments);
      }

      if (!checkParentDir(parentDirEntry, user)) {
        const s3Keys = uploads.map((u) => u.s3Key);
        await deleteS3Objects(s3Keys);
        return ctx.respond(null, STATUS_CODE.Forbidden);
      }

      const parentDirId = parentDirEntry.value.id;

      const nullInodeCheck = {
        key: inodesKeys.byDir(parentDirId, inode.name),
        versionstamp: null,
      };

      const atomic = kv.atomic();
      setInodeByDir({ parentDirId, inode, atomic });
      setUploadSize({ userId: user.id, size: upload.fileSize, atomic });
      atomic.check(parentDirEntry, nullInodeCheck);
      commit = await atomic.commit();
      i++;
    }
    completedIds.push(upload.uploadId);
  }

  return ctx.json(completedIds);
}

function checkParentDir(
  entry: Deno.KvEntryMaybe<DirNode>,
  user: User,
): entry is Deno.KvEntry<DirNode> {
  return entry.value?.ownerId === user.id;
}

function deleteS3Objects(s3Keys: string[]) {
  return enqueue<QueueMsgDeleteS3Objects>({
    type: "delete-s3-objects",
    s3Keys,
    bucket: INODES_BUCKET,
  }).commit();
}

function isValidReqData(data: unknown): data is ReqData {
  const { uploads, pathname } = data as Partial<ReqData>;
  return typeof data === "object" &&
    typeof pathname === "string" &&
    Array.isArray(uploads) && uploads.every((upload) => {
      const {
        uploadId,
        s3Key,
        fileName,
        fileType,
        checksum,
        finishedParts,
      } = upload as Partial<CompletedUpload>;
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
