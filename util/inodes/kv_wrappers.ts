import { newQueue } from "@henrygd/queue";
import { INODES_BUCKET } from "../consts.ts";
import type { Inode } from "../inodes/types.ts";
import { enqueue } from "../kv/enqueue.ts";
import { setFileNodeStats } from "../kv/filenodes_stats.ts";
import {
  deleteDirByPath,
  deleteInode,
  deleteRootDirByOwner,
  setDirByPath,
  setInode,
  setRootDirByOwner,
} from "../kv/inodes.ts";
import { kv } from "../kv/kv.ts";
import { type QueueMsgCleanUpInode } from "../queue/clean_up_inode.ts";
import { type QueueMsgDeleteDirChildren } from "../queue/delete_dir_children.ts";
import { type QueueMsgDeleteS3Objects } from "../queue/delete_s3_objects.ts";
import { isFileNodeWithS3Prefixes, isVideoNode } from "./helpers.ts";

export function setAnyInode<T extends Inode>(inode: T, atomic = kv.atomic()) {
  setInode(inode, atomic);
  if (inode.type === "dir") {
    setDirByPath(inode, atomic);
    if (inode.pathSegments.length === 1) {
      setRootDirByOwner(inode, atomic);
    }
  }
  return atomic;
}

export async function deleteInodesRecursive(inodes: Inode[]) {
  const queue = newQueue(5);
  const s3KeysToDelete: QueueMsgDeleteS3Objects["s3KeysData"] = [];

  for (const inode of inodes) {
    const atomic = kv.atomic();

    deleteAnyInode(inode, atomic);

    let pendingMediaConvertJob;
    if (isVideoNode(inode) && inode.mediaConvert.status === "PENDING") {
      pendingMediaConvertJob = inode.mediaConvert.jobId;
    }

    enqueue<QueueMsgCleanUpInode>({
      type: "clean-up-inode",
      inodeId: inode.id,
      pendingMediaConvertJob,
    }, atomic);

    if (inode.type === "dir") {
      enqueue<QueueMsgDeleteDirChildren>({
        type: "delete-dir-children",
        dirId: inode.id,
      }, atomic);
    }

    if (inode.type === "file") {
      s3KeysToDelete.push({
        name: inode.s3Key,
        isPrefix: isFileNodeWithS3Prefixes(inode),
      });
    }

    queue.add(() => atomic.commit());
  }

  if (s3KeysToDelete.length) {
    queue.add(() =>
      enqueue<QueueMsgDeleteS3Objects>({
        type: "delete-s3-objects",
        bucket: INODES_BUCKET,
        s3KeysData: s3KeysToDelete,
      }).commit()
    );
  }

  await queue.done();
}

function deleteAnyInode(inode: Inode, atomic = kv.atomic()) {
  deleteInode(inode, atomic);
  if (inode.type === "file") {
    setFileNodeStats({
      fileNode: inode,
      isAdd: false,
      atomic,
    });
  } else if (inode.type === "dir") {
    deleteDirByPath(inode, atomic);
    if (inode.pathSegments.length === 1) {
      deleteRootDirByOwner(inode, atomic);
    }
  }
  return atomic;
}
