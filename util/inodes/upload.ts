import { s3 } from "$aws";
import { getPermissions } from "$util";
import { type QueueMsgDeleteS3Objects } from "../../handlers/queue/delete_s3_objects.ts";
import { INODES_BUCKET } from "../../util/consts.ts";
import { createFileNode } from "../../util/inodes/kv_wrappers.ts";
import type { DirNode, FileNode, Inode } from "../../util/inodes/types.ts";
import { enqueue } from "../../util/kv/enqueue.ts";
import { getInodeById, keys as getInodeKey } from "../../util/kv/inodes.ts";
import { kv } from "../../util/kv/kv.ts";
import type { User } from "../types.ts";

export function isValidUploadDirEntry(
  entry: Deno.KvEntryMaybe<Inode>,
  user: User,
): entry is Deno.KvEntry<DirNode> {
  const inode = entry.value;
  return !!inode && inode.type === "dir" && !inode.isRootDir &&
    getPermissions({ user, resource: inode }).canCreate;
}

export function cleanupUnsavedFileNodes(
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

export async function saveFileNode(options: {
  upload: s3.CompletedMultipartUpload & { fileSize: number };
  fileNode: FileNode;
  dirEntry: Deno.KvEntryMaybe<DirNode>;
  dirId: string;
  user: User;
  origin: string;
}) {
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
