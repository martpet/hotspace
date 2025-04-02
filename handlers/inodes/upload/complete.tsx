import { s3 } from "$aws";
import { completeUploads } from "$upload";
import { getPermissions } from "$util";
import { STATUS_CODE } from "@std/http";
import { ulid } from "@std/ulid";
import { getSigner } from "../../../util/aws.ts";
import { INODES_BUCKET } from "../../../util/consts.ts";
import { createFileNode } from "../../../util/inodes/kv_wrappers.ts";
import { enqueue } from "../../../util/kv/enqueue.ts";
import { getInodeById, keys as getInodeKey } from "../../../util/kv/inodes.ts";
import { kv } from "../../../util/kv/kv.ts";
import type {
  AppContext,
  DirNode,
  FileNode,
  Inode,
  User,
} from "../../../util/types.ts";
import { QueueMsgDeleteS3Objects } from "../../queue/delete_s3_objects.ts";

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

  const { uploads, dirId } = reqData;
  const dirEntry = await getInodeById(dirId);

  if (!isValidUploadDirEntry(dirEntry, user)) {
    return ctx.respond(null, STATUS_CODE.NotFound);
  }

  const { completedUploads } = await completeUploads({
    uploads,
    bucket: INODES_BUCKET,
    signer: getSigner(),
  });

  const completedUploadsIds = [];

  saving: for (const upload of completedUploads) {
    const fileNode: FileNode = {
      id: ulid(),
      type: "file",
      fileType: upload.fileType,
      fileSize: upload.fileSize,
      s3Key: upload.s3Key,
      name: "",
      parentDirId: dirId,
      ownerId: user.id,
      acl: dirEntry.value.acl,
      aclStats: dirEntry.value.aclStats,
    };

    const isSaved = await saveFileNode({
      upload,
      fileNode,
      dirEntry,
      dirId,
      user,
      origin,
    });

    if (!isSaved) {
      await cleanupUnsavedFileNodes(uploads, completedUploadsIds);
      break saving;
    }

    completedUploadsIds.push(upload.uploadId);
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
  const inode = entry.value;
  return !!inode && inode.type === "dir" && !inode.isRootDir &&
    getPermissions({ user, resource: inode }).canCreate;
}

function cleanupUnsavedFileNodes(
  uploads: s3.CompletedMultipartUpload[],
  completedIds: string[] = [],
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

interface SaveFileNodeOptions {
  upload: s3.CompletedMultipartUpload & { fileSize: number };
  fileNode: FileNode;
  dirEntry: Deno.KvEntryMaybe<DirNode>;
  dirId: string;
  user: User;
  origin: string;
}

export async function saveFileNode(options: SaveFileNodeOptions) {
  const { upload, fileNode, dirId, user, origin } = options;
  let dirEntry = options.dirEntry;
  let commit = { ok: false };
  let retry = 0;

  while (!commit.ok) {
    fileNode.name = encodeURIComponent(upload.fileName);
    if (retry) {
      fileNode.name += `-${retry + 1}`;
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
    createFileNode({ fileNode, origin, atomic });
    commit = await atomic.commit();
    retry++;
  }
  return true;
}
