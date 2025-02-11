import { INODES_BUCKET } from "../consts.ts";
import type { DirNode, FileNode, Inode, User } from "../types.ts";
import { enqueue } from "./enqueue.ts";
import { kv } from "./kv.ts";
import { type QueueMsgDeleteChat } from "./queue_handlers/delete_chat.ts";
import { type QueueMsgDeleteS3Objects } from "./queue_handlers/delete_s3_objects.ts";
import { setUploadSize } from "./upload_size.ts";

export const keys = {
  inodesByDir: (
    dirId: string,
    inodeName: string,
  ) => ["inodes_by_dir", dirId, inodeName],

  dirsByPath: (pathSegments: string[]) => ["dirs_by_path", ...pathSegments],

  rootDirsByOwner: (
    ownerId: string,
    dirId: string,
  ) => ["root_dirs_by_owner", ownerId, dirId],
};

export function setInode({
  inode,
  parentDirId,
  atomic = kv.atomic(),
}: {
  inode: Inode;
  parentDirId: string;
  atomic?: Deno.AtomicOperation;
}) {
  return atomic.set(keys.inodesByDir(parentDirId, inode.name), inode);
}

export function deleteInode({
  inode,
  parentDirId,
  atomic = kv.atomic(),
}: {
  inode: Inode;
  parentDirId: string;
  atomic?: Deno.AtomicOperation;
}) {
  return atomic.delete(keys.inodesByDir(parentDirId, inode.name));
}

export function deleteFileNode({
  fileNodeEntry,
  parentDirId,
  user,
  atomic = kv.atomic(),
}: {
  fileNodeEntry: Deno.KvEntry<FileNode>;
  parentDirId: string;
  user: User;
  atomic?: Deno.AtomicOperation;
}) {
  const fileNode = fileNodeEntry.value;
  atomic.check(fileNodeEntry);

  deleteInode({
    inode: fileNode,
    parentDirId,
    atomic,
  });

  setUploadSize({
    user,
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

export function getInode<T = Inode>({
  inodeName,
  parentDirId,
  consistency,
}: {
  inodeName: string;
  parentDirId: string;
  consistency?: Deno.KvConsistencyLevel;
}) {
  return kv.get<T>(keys.inodesByDir(parentDirId, inodeName), { consistency });
}

export async function listInodesByDir(
  dirId: string,
  options?: Deno.KvListOptions,
) {
  const prefix = keys.inodesByDir(dirId, "").slice(0, -1);
  const iter = kv.list<Inode>({ prefix }, options);
  return (await Array.fromAsync(iter)).map((x) => x.value);
}

export function setDir({
  dir,
  parentDirId,
  pathSegments,
  atomic = kv.atomic(),
}: {
  dir: DirNode;
  parentDirId: string | undefined;
  pathSegments: string[];
  atomic?: Deno.AtomicOperation;
}) {
  atomic.set(keys.dirsByPath(pathSegments), dir);
  if (parentDirId) {
    setInode({ inode: dir, parentDirId: parentDirId, atomic });
  } else {
    atomic.set(keys.rootDirsByOwner(dir.ownerId, dir.id), dir);
  }
  return atomic;
}

export function getDir(
  pathSegments: string[],
  consistency?: Deno.KvConsistencyLevel,
) {
  return kv.get<DirNode>(keys.dirsByPath(pathSegments), { consistency });
}

export async function listRootDirsByOwner(
  ownerId: string,
  options?: Deno.KvListOptions,
) {
  const prefix = keys.rootDirsByOwner(ownerId, "").slice(0, -1);
  const iter = kv.list<DirNode>({ prefix }, options);
  return (await Array.fromAsync(iter)).map((x) => x.value);
}
