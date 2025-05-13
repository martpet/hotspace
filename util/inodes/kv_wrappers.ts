import { newQueue } from "@henrygd/queue";
import { pick } from "@std/collections";
import { INODES_BUCKET } from "../consts.ts";
import type { Inode, InodeBase } from "../inodes/types.ts";
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
import { isFileNodeWithMultipleS3Keys } from "./helpers.ts";
import { isPostProcessedToVideo } from "./post_process/type_predicates.ts";

export function setAnyInode(
  inode: Inode,
  atomic = kv.atomic(),
) {
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

    if (
      isPostProcessedToVideo(inode) &&
      inode.postProcess.status === "PENDING"
    ) {
      pendingMediaConvertJob = inode.postProcess.jobId;
    }

    enqueue<QueueMsgCleanUpInode>({
      type: "clean-up-inode",
      inode: pick(inode as InodeBase, ["id", "ownerId", "acl"]),
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
        isPrefix: isFileNodeWithMultipleS3Keys(inode),
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
