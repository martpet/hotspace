import { s3 } from "$aws";
import { completeUploads } from "$upload";
import { STATUS_CODE } from "@std/http";
import { ulid } from "@std/ulid";
import { getSigner } from "../../../util/aws.ts";
import { INODES_BUCKET } from "../../../util/consts.ts";
import { isPostProcessableUpload } from "../../../util/inodes/util.ts";
import { enqueue } from "../../../util/kv/enqueue.ts";
import {
  getInodeById,
  keys as getInodeKey,
  setInode,
} from "../../../util/kv/inodes.ts";
import { kv } from "../../../util/kv/kv.ts";
import { QueueMsgDeleteS3Objects } from "../../../util/kv/queue_handlers/delete_s3_objects.ts";
import { type QueueMsgPostProcessUploads } from "../../../util/kv/queue_handlers/post_process_uploads.ts";
import { setUploadSize } from "../../../util/kv/upload_size.ts";
import type {
  AppContext,
  DirNode,
  FileNode,
  Inode,
  User,
} from "../../../util/types.ts";

type ReqData = {
  uploads: s3.CompletedMultipartUpload[];
  dirId: string;
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

  const { uploads, dirId } = reqData;
  const dirEntry = await getInodeById(dirId);

  if (!isValidUploadDirEntry(dirEntry, user)) {
    return ctx.respond(null, STATUS_CODE.Forbidden);
  }

  const { completedUploads } = await completeUploads({
    uploads,
    bucket: INODES_BUCKET,
    signer: getSigner(),
  });

  const completedUploadsIds = [];
  const inodeIdsToPostProcess = [];

  saveInodes: for (const upload of completedUploads) {
    const fileNode: FileNode = {
      id: ulid(),
      type: "file",
      fileType: upload.fileType,
      fileSize: upload.fileSize,
      s3Key: upload.s3Key,
      name: "",
      parentDirId: dirId,
      ownerId: user.id,
    };

    const isSaved = await saveFileNode({
      upload,
      fileNode,
      dirEntry,
      dirId,
      user,
    });

    if (!isSaved) {
      await cleanupUnsavedFileNodes(uploads, completedUploadsIds);
      break saveInodes;
    }

    completedUploadsIds.push(upload.uploadId);

    if (isPostProcessableUpload(upload)) {
      inodeIdsToPostProcess.push(fileNode.id);
    }
  }

  if (inodeIdsToPostProcess.length) {
    await enqueue<QueueMsgPostProcessUploads>({
      type: "post-process-uploads",
      ids: inodeIdsToPostProcess,
    }).commit();
  }

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

export function isValidUploadDirEntry(
  entry: Deno.KvEntryMaybe<Inode>,
  user: User,
): entry is Deno.KvEntry<DirNode> {
  return entry.value !== null &&
    entry.value.type === "dir" &&
    !entry.value.isRootDir &&
    entry.value?.ownerId === user.id;
}

function cleanupUnsavedFileNodes(
  uploads: s3.CompletedMultipartUpload[],
  completedIds: string[],
) {
  const s3Keys = [];
  for (const upload of uploads) {
    if (!completedIds.includes(upload.uploadId)) {
      s3Keys.push({ name: upload.s3Key });
    }
  }
  if (s3Keys.length) {
    return enqueue<QueueMsgDeleteS3Objects>({
      type: "delete-s3-objects",
      s3Keys,
      bucket: INODES_BUCKET,
    }).commit();
  }
}

export async function saveFileNode({
  upload,
  fileNode,
  dirEntry,
  dirId,
  user,
}: {
  upload: s3.CompletedMultipartUpload & { fileSize: number };
  fileNode: FileNode;
  dirEntry: Deno.KvEntryMaybe<DirNode>;
  dirId: string;
  user: User;
}) {
  let commit = { ok: false };
  let i = 0;
  while (!commit.ok) {
    fileNode.name = encodeURIComponent(upload.fileName);
    if (i > 0) {
      fileNode.name += `-${i + 1}`;
      dirEntry = await getInodeById(dirId);
    }
    if (!isValidUploadDirEntry(dirEntry, user)) {
      return false;
    }
    const atomic = kv.atomic();
    const fileNodeNullCheck = {
      key: getInodeKey.byDir(dirEntry.value.id, fileNode.name),
      versionstamp: null,
    };
    atomic.check(dirEntry, fileNodeNullCheck);
    setInode(fileNode, atomic);
    setUploadSize({
      userId: fileNode.ownerId,
      size: upload.fileSize,
      atomic,
    });
    commit = await atomic.commit();
    i++;
  }
  return true;
}
