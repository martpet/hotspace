import { newQueue } from "@henrygd/queue";
import { INODES_BUCKET } from "./consts.ts";
import { enqueue } from "./kv/enqueue.ts";
import {
  deleteDirNode,
  deleteInodeByDir,
  listInodesEntriesByDir,
} from "./kv/inodes.ts";
import { kv } from "./kv/kv.ts";
import { type QueueMsgDeleteChat } from "./kv/queue_handlers/delete_chat.ts";
import { type QueueMsgDeleteDirChildren } from "./kv/queue_handlers/delete_dir_children.ts";
import { type QueueMsgDeleteS3Objects } from "./kv/queue_handlers/delete_s3_objects.ts";
import { setUploadSize } from "./kv/upload_size.ts";
import type { DirNode, FileNode, Inode } from "./types.ts";

export async function deleteDirChildren({
  pathSegments,
  dirId,
  userId,
  entries,
}: {
  pathSegments: string[];
  dirId: string;
  userId: string;
  entries?: Deno.KvEntryMaybe<Inode>[];
}) {
  const queue = newQueue(5);
  entries = entries || await listInodesEntriesByDir(dirId);

  for (const entry of entries) {
    if (!entry.value || entry.value.ownerId !== userId) {
      continue;
    }
    if (entry.value.type === "file") {
      queue.add(() =>
        deleteFile({
          fileNodeEntry: entry as Deno.KvEntry<FileNode>,
          parentDirId: dirId,
          userId,
        }).commit()
      );
    } else {
      queue.add(() =>
        deleteDir({
          dirNodeEntry: entry as Deno.KvEntry<DirNode>,
          parentDirId: dirId,
          pathSegments: [...pathSegments, entry.value.name],
          userId,
        }).commit()
      );
    }
  }
  return queue.done();
}

export function deleteFile({
  fileNodeEntry,
  parentDirId,
  userId,
  atomic = kv.atomic(),
}: {
  fileNodeEntry: Deno.KvEntry<FileNode>;
  parentDirId: string;
  userId: string;
  atomic?: Deno.AtomicOperation;
}) {
  const fileNode = fileNodeEntry.value;
  atomic.check(fileNodeEntry);

  deleteInodeByDir({
    inodeName: fileNode.name,
    parentDirId,
    atomic,
  });

  setUploadSize({
    userId,
    size: -fileNode.fileSize,
    atomic,
  });

  enqueue<QueueMsgDeleteChat>({
    type: "delete-chat",
    chatId: fileNode.id,
  }, atomic);

  enqueue<QueueMsgDeleteS3Objects>({
    type: "delete-s3-objects",
    s3Keys: [fileNode.s3Key],
    bucket: INODES_BUCKET,
  }, atomic);

  return atomic;
}

export function deleteDir({
  dirNodeEntry,
  parentDirId,
  pathSegments,
  userId,
  atomic = kv.atomic(),
}: {
  dirNodeEntry: Deno.KvEntry<DirNode>;
  parentDirId: string;
  pathSegments: string[];
  userId: string;
  atomic?: Deno.AtomicOperation;
}) {
  const dirNode = dirNodeEntry.value;
  atomic.check(dirNodeEntry);

  deleteDirNode({
    dirNode,
    parentDirId,
    pathSegments,
    atomic,
  });

  enqueue<QueueMsgDeleteChat>({
    type: "delete-chat",
    chatId: dirNode.id,
  }, atomic);

  enqueue<QueueMsgDeleteDirChildren>({
    type: "delete-dir-children",
    dirId: dirNode.id,
    pathSegments,
    userId,
  }, atomic);

  return atomic;
}
