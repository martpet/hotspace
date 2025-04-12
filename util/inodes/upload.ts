import { s3 } from "$aws";
import { getPermissions } from "$util";
import { ulid } from "@std/ulid/ulid";
import { type QueueMsgDeleteS3Objects } from "../../handlers/queue/delete_s3_objects.ts";
import { type QueueMsgPostProcessVideoNode } from "../../handlers/queue/post_process_video_node.ts";
import { INODES_BUCKET } from "../../util/consts.ts";
import type { DirNode, FileNode, Inode } from "../../util/inodes/types.ts";
import { enqueue } from "../../util/kv/enqueue.ts";
import { getInodeById, keys as inodesKeys } from "../../util/kv/inodes.ts";
import { kv } from "../../util/kv/kv.ts";
import { setFileNodeStats } from "../kv/filenodes_stats.ts";
import type { User } from "../types.ts";
import { isVideoNode } from "./helpers.ts";
import { setAnyInode } from "./kv_wrappers.ts";

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

export async function createFileNodeFromUpload(options: {
  upload: s3.CompletedMultipartUpload & { fileSize: number };
  dirEntry: Deno.KvEntryMaybe<DirNode>;
  dirId: string;
  user: User;
  origin: string;
}) {
  const { upload, dirId, user, origin } = options;
  let dirEntry = options.dirEntry;
  let commit = { ok: false };
  let commitIndex = 0;

  while (!commit.ok) {
    let fileNodeName = encodeURIComponent(upload.fileName);

    if (commitIndex) {
      fileNodeName += `-${commitIndex + 1}`;
      dirEntry = await getInodeById(dirId);
    }

    if (!isValidUploadDirEntry(dirEntry, user)) {
      return false;
    }

    const fileNode: FileNode = {
      id: ulid(),
      type: "file",
      fileType: upload.fileType,
      fileSize: upload.fileSize,
      s3Key: upload.s3Key,
      name: fileNodeName,
      parentDirId: dirId,
      ownerId: user.id,
      acl: dirEntry.value.acl,
      aclStats: dirEntry.value.aclStats,
    };

    const fileNodeNullCheck = {
      key: inodesKeys.byDir(dirEntry.value.id, fileNode.name),
      versionstamp: null,
    };

    const atomic = kv.atomic();
    atomic.check(dirEntry, fileNodeNullCheck);
    setAnyInode(fileNode, atomic);
    setFileNodeStats({ fileNode, isAdd: true, atomic });

    if (isVideoNode(fileNode)) {
      enqueue<QueueMsgPostProcessVideoNode>({
        type: "post-process-video-node",
        inodeId: fileNode.id,
        origin,
      }, atomic);
    }

    commit = await atomic.commit();
    commitIndex++;
  }
  return true;
}
