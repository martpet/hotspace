import { newQueue } from "@henrygd/queue";
import { INODES_BUCKET } from "./consts.ts";
import { enqueue } from "./kv/enqueue.ts";
import {
  deleteDirByPath,
  deleteInode,
  deleteRootDirByOwner,
  setDirByPath,
  setInode,
  setRootDirByOwner,
} from "./kv/inodes.ts";
import { kv } from "./kv/kv.ts";
import { type QueueMsgDeleteChat } from "./kv/queue_handlers/delete_chat.ts";
import { type QueueMsgDeleteDirChildren } from "./kv/queue_handlers/delete_dir_children.ts";
import { type QueueMsgDeleteS3Objects } from "./kv/queue_handlers/delete_s3_objects.ts";
import { setUploadSize } from "./kv/upload_size.ts";
import type { Inode } from "./types.ts";

const ROOT_DIR_ID = "0";

export function createRootDir() {
  return setDirByPath({
    id: ROOT_DIR_ID,
    type: "dir",
    name: "root",
    parentDirId: "",
    pathSegments: [],
    isRootNode: true,
    ownerId: "",
  }).commit();
}

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

export function deleteInodesComplete(entries: Deno.KvEntryMaybe<Inode>[]) {
  const queue = newQueue(5);
  for (const entry of entries) {
    if (entry.value) {
      queue.add(() => deleteInodeComplete(entry).commit());
    }
  }
  return queue.done();
}

function deleteInodeComplete(
  inodeEntry: Deno.KvEntry<Inode>,
  atomic = kv.atomic(),
) {
  const inode = inodeEntry.value;

  atomic.check(inodeEntry);

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
  } else {
    setUploadSize({
      userId: inode.ownerId,
      size: -inode.fileSize,
      atomic,
    });
    enqueue<QueueMsgDeleteS3Objects>({
      type: "delete-s3-objects",
      s3Keys: [inode.s3Key],
      bucket: INODES_BUCKET,
    }, atomic);
  }

  return atomic;
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
