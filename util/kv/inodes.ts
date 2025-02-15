import type { DirNode, Inode } from "../types.ts";
import { kv } from "./kv.ts";

export const keys = {
  byDir: (
    dirId: string,
    inodeName: string,
  ) => ["inodes_by_dir", dirId, inodeName],

  dirsByPath: (pathSegments: string[]) => ["dirs_by_path", ...pathSegments],

  rootDirsByOwner: (
    ownerId: string,
    dirId: string,
  ) => ["root_dirs_by_owner", ownerId, dirId],
};

export function setInodeByDir({
  inode,
  parentDirId,
  atomic = kv.atomic(),
}: {
  inode: Inode;
  parentDirId: string;
  atomic?: Deno.AtomicOperation;
}) {
  return atomic.set(keys.byDir(parentDirId, inode.name), inode);
}

export function getInodeByDir<T = Inode>({
  inodeName,
  parentDirId,
  consistency,
}: {
  inodeName: string;
  parentDirId: string;
  consistency?: Deno.KvConsistencyLevel;
}) {
  return kv.get<T>(keys.byDir(parentDirId, inodeName), { consistency });
}

export function deleteInodeByDir({
  inodeName,
  parentDirId,
  atomic = kv.atomic(),
}: {
  inodeName: string;
  parentDirId: string;
  atomic?: Deno.AtomicOperation;
}) {
  return atomic.delete(keys.byDir(parentDirId, inodeName));
}

export async function listInodesEntriesByDir(
  dirId: string,
  options?: Deno.KvListOptions,
) {
  const prefix = keys.byDir(dirId, "").slice(0, -1);
  const iter = kv.list<Inode>({ prefix }, options);
  return await Array.fromAsync(iter);
}

export async function listInodesByDir(
  dirId: string,
  options?: Deno.KvListOptions,
) {
  const entries = await listInodesEntriesByDir(dirId, options);
  return entries.map((x) => x.value);
}

export function setDirNode({
  dirNode,
  parentDirId,
  pathSegments,
  atomic = kv.atomic(),
}: {
  dirNode: DirNode;
  parentDirId: string | undefined;
  pathSegments: string[];
  atomic?: Deno.AtomicOperation;
}) {
  atomic.set(keys.dirsByPath(pathSegments), dirNode);
  if (parentDirId) {
    setInodeByDir({ inode: dirNode, parentDirId: parentDirId, atomic });
  } else {
    atomic.set(keys.rootDirsByOwner(dirNode.ownerId, dirNode.id), dirNode);
  }
  return atomic;
}

export function getDirNode(
  pathSegments: string[],
  consistency?: Deno.KvConsistencyLevel,
) {
  return kv.get<DirNode>(keys.dirsByPath(pathSegments), { consistency });
}

export function deleteDirNode({
  dirNode,
  parentDirId,
  pathSegments,
  atomic = kv.atomic(),
}: {
  dirNode: DirNode;
  parentDirId: string | undefined;
  pathSegments: string[];
  atomic?: Deno.AtomicOperation;
}) {
  if (parentDirId) {
    deleteInodeByDir({
      inodeName: dirNode.name,
      parentDirId: parentDirId,
      atomic,
    });
  } else {
    atomic.delete(keys.rootDirsByOwner(dirNode.ownerId, dirNode.id));
  }
  atomic.delete(keys.dirsByPath(pathSegments));
  return atomic;
}

export async function listRootDirsByOwner(
  ownerId: string,
  options?: Deno.KvListOptions,
) {
  const prefix = keys.rootDirsByOwner(ownerId, "").slice(0, -1);
  const iter = kv.list<DirNode>({ prefix }, options);
  return (await Array.fromAsync(iter)).map((x) => x.value);
}
