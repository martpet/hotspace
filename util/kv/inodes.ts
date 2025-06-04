import type { DirNode, Inode } from "../inodes/types.ts";
import { kv } from "./kv.ts";

export const keys = {
  byId: (id: string) => ["inodes", id],

  byDir: (
    dirId: string,
    inodeName: string,
  ) => ["inodes_by_dir", dirId, inodeName.toLowerCase()],

  dirsByPath: (
    pathSegments: string[],
  ) => ["dirs_by_path", ...pathSegments.map((it) => it.toLowerCase())],

  rootDirsByOwner: (
    ownerId: string,
    dirId: string,
  ) => ["root_dirs_by_owner", ownerId, dirId],
};

// =====================
// Inodes
// =====================

export function setInode(inode: Inode, atomic = kv.atomic()) { // Do not use directly
  return atomic
    .set(keys.byId(inode.id), inode)
    .set(keys.byDir(inode.parentDirId, inode.name), inode);
}

export function deleteInode(inode: Inode, atomic = kv.atomic()) { // Do not use directly
  return atomic
    .delete(keys.byId(inode.id))
    .delete(keys.byDir(inode.parentDirId, inode.name));
}

export function getInodeById(
  id: string,
  options: { consistency?: Deno.KvConsistencyLevel } = {},
) {
  const { consistency } = options;
  return kv.get<Inode>(keys.byId(id), { consistency });
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

export function listInodesEntriesByDir(
  dirId: string,
  options?: Deno.KvListOptions,
) {
  const prefix = keys.byDir(dirId, "").slice(0, -1);
  const iter = kv.list<Inode>({ prefix }, options);
  return Array.fromAsync(iter);
}

export async function listInodesByDir(
  dirId: string,
  options?: Deno.KvListOptions,
) {
  const entries = await listInodesEntriesByDir(dirId, options);
  const values = entries.map((x) => x.value);
  sortByDateAndName(values);
  return values;
}

// =====================
// Dirs
// =====================

export function setDirByPath(dirNode: DirNode, atomic = kv.atomic()) {
  return atomic.set(keys.dirsByPath(dirNode.pathSegments), dirNode);
}

export function deleteDirByPath(dirNode: DirNode, atomic = kv.atomic()) {
  atomic.delete(keys.dirsByPath(dirNode.pathSegments));
  return atomic;
}

export function getDirByPath(
  pathSegments: string[],
  options: { consistency?: Deno.KvConsistencyLevel } = {},
) {
  const { consistency } = options;
  return kv.get<DirNode>(keys.dirsByPath(pathSegments), { consistency });
}

// =====================
// Root Dirs by Owner
// =====================

export function setRootDirByOwner(dirNode: DirNode, atomic = kv.atomic()) {
  return atomic.set(keys.rootDirsByOwner(dirNode.ownerId, dirNode.id), dirNode);
}

export function deleteRootDirByOwner(dirNode: DirNode, atomic = kv.atomic()) {
  return atomic.delete(keys.rootDirsByOwner(dirNode.ownerId, dirNode.id));
}

export async function listRootDirsByOwner(
  ownerId: string,
  options?: Deno.KvListOptions,
) {
  const prefix = keys.rootDirsByOwner(ownerId, "").slice(0, -1);
  const iter = kv.list<DirNode>({ prefix }, options);
  const entries = await Array.fromAsync(iter);
  const values = entries.map((x) => x.value);
  sortByDateAndName(values);
  return values;
}

// =====================
// Util
// =====================

function sortByDateAndName(inodes: Inode[]) {
  inodes.sort((a, b) => {
    const timeA = a.id.slice(0, 10);
    const timeB = b.id.slice(0, 10);
    const primary = timeB.localeCompare(timeA);
    if (primary !== 0) return primary;
    const nameA = decodeURIComponent(a.name);
    const nameB = decodeURIComponent(b.name);
    return nameA.localeCompare(nameB);
  });
}
