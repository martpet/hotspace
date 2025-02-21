import type { DirNode, Inode } from "../types.ts";
import { kv } from "./kv.ts";

export const keys = {
  byDir: (
    dirId: string,
    inodeName: string,
  ) => ["inodes_by_dir", dirId, inodeName],

  dirsByPath: (
    pathSegments: string[],
  ) => ["dirs_by_path", ...pathSegments],

  rootDirsByOwner: (
    ownerId: string,
    dirId: string,
  ) => ["root_dirs_by_owner", ownerId, dirId],
};

// =====================
// Inodes by Dir
// =====================

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

export async function listInodesByDir(
  dirId: string,
  options?: Deno.KvListOptions,
) {
  const entries = await listInodesEntriesByDir(dirId, options);
  return entries.map((x) => x.value);
}

export async function listInodesEntriesByDir(
  dirId: string,
  options?: Deno.KvListOptions,
) {
  const prefix = keys.byDir(dirId, "").slice(0, -1);
  const iter = kv.list<Inode>({ prefix }, options);
  return await Array.fromAsync(iter);
}

// =====================
// Dirs by Path
// =====================

export function setDirByPath({
  dirNode,
  pathSegments,
  atomic = kv.atomic(),
}: {
  dirNode: DirNode;
  pathSegments: string[];
  atomic?: Deno.AtomicOperation;
}) {
  return atomic.set(keys.dirsByPath(pathSegments), dirNode);
}

export function getDirByPath(
  pathSegments: string[],
  options: { consistency?: Deno.KvConsistencyLevel } = {},
) {
  const { consistency } = options;
  return kv.get<DirNode>(keys.dirsByPath(pathSegments), { consistency });
}

export function deleteDirByPath(pathSegments: string[], atomic = kv.atomic()) {
  atomic.delete(keys.dirsByPath(pathSegments));
  return atomic;
}

// =====================
// Root Dirs by Owner
// =====================

export function setRootDirByOwner(dirNode: DirNode, atomic = kv.atomic()) {
  return atomic.set(keys.rootDirsByOwner(dirNode.ownerId, dirNode.id), dirNode);
}
export async function listRootDirsEntriesByOwner(
  ownerId: string,
  options?: Deno.KvListOptions,
) {
  const prefix = keys.rootDirsByOwner(ownerId, "").slice(0, -1);
  const iter = kv.list<DirNode>({ prefix }, options);
  return await Array.fromAsync(iter);
}

export async function listRootDirsByOwner(
  ownerId: string,
  options?: Deno.KvListOptions,
) {
  const entries = await listRootDirsEntriesByOwner(ownerId, options);
  return entries.map((x) => x.value);
}

export function deleteRootDirByOwner(dirNode: DirNode, atomic = kv.atomic()) {
  return atomic.delete(keys.rootDirsByOwner(dirNode.ownerId, dirNode.id));
}
