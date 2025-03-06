import { newQueue } from "@henrygd/queue";
import { type QueueMsgCleanUpInode } from "../../handlers/queue/clean_up_inode.ts";
import { type QueueMsgDeleteDirChildren } from "../../handlers/queue/delete_dir_children.ts";
import {
  type QueueMsgDeleteS3Objects,
} from "../../handlers/queue/delete_s3_objects.ts";
import { INODES_BUCKET } from "../consts.ts";
import { enqueue } from "../kv/enqueue.ts";
import {
  deleteDirByPath,
  deleteInode,
  deleteRootDirByOwner,
  setDirByPath,
  setInode,
  setRootDirByOwner,
} from "../kv/inodes.ts";
import { kv } from "../kv/kv.ts";
import { setUploadSize } from "../kv/upload_size.ts";
import type { Inode, VideoNode } from "../types.ts";
import { isFileNodeWithManyS3Objects } from "./util.ts";

export function setAnyInode(inode: Inode, atomic = kv.atomic()) {
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
  const s3KeysToDelete: QueueMsgDeleteS3Objects["s3Keys"] = [];

  for (const inode of inodes) {
    const atomic = kv.atomic();

    deleteAnyInode(inode, atomic);

    enqueue<QueueMsgCleanUpInode>({
      type: "clean-up-inode",
      inodeId: inode.id,
      pendingMediaConvertJobId: (inode as VideoNode).mediaConvert?.jobId,
    }, atomic);

    if (inode.type === "dir") {
      enqueue<QueueMsgDeleteDirChildren>({
        type: "delete-dir-children",
        dirId: inode.id,
      }, atomic);
    }

    if (inode.type === "file") {
      setUploadSize({
        userId: inode.ownerId,
        size: -inode.fileSize,
        atomic,
      });

      s3KeysToDelete.push({
        name: inode.s3Key,
        isPrefix: isFileNodeWithManyS3Objects(inode),
      });
    }

    queue.add(() => atomic.commit());
  }

  if (s3KeysToDelete.length) {
    queue.add(() =>
      enqueue<QueueMsgDeleteS3Objects>({
        type: "delete-s3-objects",
        bucket: INODES_BUCKET,
        s3Keys: s3KeysToDelete,
      }).commit()
    );
  }

  await queue.done();
}

function deleteAnyInode(inode: Inode, atomic = kv.atomic()) {
  deleteInode(inode, atomic);
  if (inode.type === "dir") {
    deleteDirByPath(inode, atomic);
    if (inode.pathSegments.length === 1) {
      deleteRootDirByOwner(inode, atomic);
    }
  }
  return atomic;
}
