import { newQueue } from "@henrygd/queue";
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
import { type QueueMsgDeleteChat } from "../kv/queue_handlers/delete_chat.ts";
import { type QueueMsgDeleteDirChildren } from "../kv/queue_handlers/delete_dir_children.ts";
import {
  type QueueMsgDeleteS3Objects,
} from "../kv/queue_handlers/delete_s3_objects.ts";
import { setUploadSize } from "../kv/upload_size.ts";
import type { Inode } from "../types.ts";
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

export async function deleteInodesFull(inodes: Inode[]) {
  const queue = newQueue(5);
  const s3KeysToDelete: QueueMsgDeleteS3Objects["s3Keys"] = [];

  for (const inode of inodes) {
    queue.add(async () => {
      const atomic = kv.atomic();

      deleteAnyInode(inode, atomic);

      enqueue<QueueMsgDeleteChat>({
        type: "delete-chat",
        chatId: inode.id,
      }, atomic);

      if (inode.type === "dir") {
        enqueue<QueueMsgDeleteDirChildren>({
          type: "delete-dir-children",
          dirId: inode.id,
        }, atomic);
      } else if (inode.type === "file") {
        setUploadSize({
          userId: inode.ownerId,
          size: -inode.fileSize,
          atomic,
        });
        // cancel mediaconvert job if not completed
        s3KeysToDelete.push({
          name: inode.s3Key,
          isPrefix: isFileNodeWithManyS3Objects(inode),
        });
      }
      await atomic.commit();
    });
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
