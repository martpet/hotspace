import type { DirNode, Inode } from "../types.ts";
import { kv } from "./kv.ts";

export const keys = {
  inodesByDir: (
    dirId: string,
    inodeName: string,
  ) => ["inodes_by_dir", dirId, inodeName],

  dirsByPath: (pathParts: string[]) => ["dirs_by_path", ...pathParts],

  rootDirsByOwner: (
    ownerId: string,
    dirId: string,
  ) => ["root_dirs_by_owner", ownerId, dirId],
};

export function setInodeByDir({
  dirId,
  inode,
  atomic = kv.atomic(),
}: {
  dirId: string;
  inode: Inode;
  atomic?: Deno.AtomicOperation;
}) {
  return atomic.set(keys.inodesByDir(dirId, inode.name), inode);
}

export async function listInodesByDir(
  dirId: string,
  options?: Deno.KvListOptions,
) {
  const prefix = keys.inodesByDir(dirId, "").slice(0, -1);
  const iter = kv.list<Inode>({ prefix }, options);
  return (await Array.fromAsync(iter)).map((x) => x.value);
}

export function setDirByPath({
  dir,
  pathParts,
  atomic = kv.atomic(),
}: {
  dir: DirNode;
  pathParts: string[];
  atomic?: Deno.AtomicOperation;
}) {
  return atomic.set(keys.dirsByPath(pathParts), dir);
}

export function getDirByPath(pathParts: string[]) {
  return kv.get<DirNode>(keys.dirsByPath(pathParts));
}

export function setRootDirByOwner(dir: DirNode, atomic = kv.atomic()) {
  return atomic.set(keys.rootDirsByOwner(dir.ownerId, dir.id), dir);
}

export async function listRootDirsByOwner(
  ownerId: string,
  options?: Deno.KvListOptions,
) {
  const prefix = keys.rootDirsByOwner(ownerId, "").slice(0, -1);
  const iter = kv.list<DirNode>({ prefix }, options);
  return (await Array.fromAsync(iter)).map((x) => x.value);
}
