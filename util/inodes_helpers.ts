import { newQueue } from "@henrygd/queue";
import { INODES_BUCKET } from "./consts.ts";
import { enqueue } from "./kv/enqueue.ts";
import {
  deleteDirByPath,
  deleteInodeByDir,
  deleteRootDirByOwner,
  listRootDirsEntriesByOwner,
  setDirByPath,
  setInodeByDir,
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
    dirNode: {
      id: ROOT_DIR_ID,
      type: "dir",
      name: "root",
      ownerId: "",
    },
    pathSegments: [],
  }).commit();
}

export function setInode({
  inode,
  pathSegments,
  parentDirId,
  atomic,
}: {
  inode: Inode;
  pathSegments: string[];
  parentDirId: string;
  atomic?: Deno.AtomicOperation;
}) {
  setInodeByDir({
    inode,
    parentDirId,
    atomic,
  });
  if (inode.type === "dir") {
    setDirByPath({
      dirNode: inode,
      pathSegments,
      atomic,
    });
    if (pathSegments.length === 1) {
      setRootDirByOwner(inode, atomic);
    }
  }
  return atomic;
}

function deleteInode({
  inode,
  pathSegments,
  parentDirId,
  atomic = kv.atomic(),
}: {
  inode: Inode;
  pathSegments: string[];
  parentDirId: string;
  atomic?: Deno.AtomicOperation;
}) {
  deleteInodeByDir({
    inodeName: inode.name,
    parentDirId: parentDirId,
    atomic,
  });
  if (inode.type === "dir") {
    deleteDirByPath(pathSegments, atomic);
    if (pathSegments.length === 1) {
      deleteRootDirByOwner(inode, atomic);
    }
  }
  return atomic;
}

function deleteInodeComplete({
  entry,
  pathSegments,
  parentDirId,
  userId,
  atomic = kv.atomic(),
}: {
  entry: Deno.KvEntry<Inode>;
  pathSegments: string[];
  parentDirId: string;
  userId: string;
  atomic?: Deno.AtomicOperation;
}) {
  const inode = entry.value;

  atomic.check(entry);

  deleteInode({
    inode,
    pathSegments,
    parentDirId,
    atomic,
  });

  enqueue<QueueMsgDeleteChat>({
    type: "delete-chat",
    chatId: inode.id,
  }, atomic);

  if (inode.type === "dir") {
    enqueue<QueueMsgDeleteDirChildren>({
      type: "delete-dir-children",
      dirId: inode.id,
      pathSegments,
      userId,
    }, atomic);
  } else {
    setUploadSize({
      userId,
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

export function deleteDirChildren({
  entries,
  dirId,
  pathSegments,
  userId,
}: {
  entries: Deno.KvEntryMaybe<Inode>[];
  dirId: string;
  pathSegments: string[];
  userId: string;
}) {
  const queue = newQueue(5);

  for (const entry of entries) {
    if (!entry.value) continue;
    queue.add(() =>
      deleteInodeComplete({
        entry,
        pathSegments: [...pathSegments, entry.value.name],
        parentDirId: dirId,
        userId,
      }).commit()
    );
  }
  return queue.done();
}

export async function deleteUserSpaces(userId: string) {
  return deleteDirChildren({
    entries: await listRootDirsEntriesByOwner(userId),
    dirId: ROOT_DIR_ID,
    pathSegments: [],
    userId,
  });
}
