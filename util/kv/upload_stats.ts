import type { FileNode } from "../inodes/types.ts";
import type { User } from "../types.ts";
import { kv, toKvSumBigInt } from "./kv.ts";

const keys = {
  mimeTypes: (mimeType: string) => ["mime_types", mimeType],
  storedBytes: () => ["stored_bytes"],
  storedBytesByUser: (id: string) => ["stored_bytes_by_user", id],
  totalUploadedBytes: () => ["total_upload_bytes"],
  totalUploadedBytesByUser: (id: string) => ["total_upload_bytes_by_user", id],
  remainingUploadBytesByUser: (
    id: string,
  ) => ["remaining_upload_bytes_by_user", id],
};

export function setUploadStats(options: {
  isAdd: boolean;
  fileNode: FileNode;
  atomic?: Deno.AtomicOperation;
}) {
  const { fileNode, isAdd, atomic = kv.atomic() } = options;
  const { fileSize } = fileNode;
  const bytesBigInt = toKvSumBigInt(isAdd ? fileSize : fileSize * -1);

  atomic
    .sum(keys.storedBytes(), bytesBigInt)
    .sum(keys.storedBytesByUser(fileNode.ownerId), bytesBigInt);

  if (fileNode.mimeType) {
    const mimeBigInt = toKvSumBigInt(isAdd ? 1 : -1);
    atomic.sum(keys.mimeTypes(fileNode.mimeType), mimeBigInt);
  }

  if (isAdd) {
    atomic
      .sum(keys.totalUploadedBytes(), bytesBigInt)
      .sum(keys.totalUploadedBytesByUser(fileNode.ownerId), bytesBigInt)
      .sum(
        keys.remainingUploadBytesByUser(fileNode.ownerId),
        toKvSumBigInt(fileSize * -1),
      );
  }

  return atomic;
}

export async function cleanupUploadStatsByUser(userId: string) {
  await kv.delete(keys.storedBytesByUser(userId));
  await kv.delete(keys.totalUploadedBytesByUser(userId));
  await kv.delete(keys.remainingUploadBytesByUser(userId));
}

export async function getTotalUploadedBytesByUser(
  user: User,
  options: { consistency?: Deno.KvConsistencyLevel } = {},
) {
  const { consistency } = options;
  const entry = await kv.get<bigint>(
    keys.totalUploadedBytesByUser(user.id),
    { consistency },
  );
  return Number(entry.value);
}

export async function getRemainingUploadBytesByUser(
  userId: string,
  options: { consistency?: Deno.KvConsistencyLevel } = {},
) {
  const { consistency } = options;
  const entry = await kv.get<bigint>(
    keys.remainingUploadBytesByUser(userId),
    { consistency },
  );
  return Number(entry.value);
}

export function addUserRemainingUploadBytes(opt: {
  bytes: number;
  userId: string;
  atomic?: Deno.AtomicOperation;
}) {
  const { bytes, userId, atomic = kv.atomic() } = opt;
  const bytesBigInt = toKvSumBigInt(bytes);
  return atomic.sum(keys.remainingUploadBytesByUser(userId), bytesBigInt);
}

export function setUserRemainingUploadBytes(opt: {
  bytes: number;
  userId: string;
}) {
  const { bytes, userId } = opt;
  return kv.set(
    keys.remainingUploadBytesByUser(userId),
    new Deno.KvU64(BigInt(bytes)),
  );
}

export async function listMimeTypes() {
  const prefix = keys.mimeTypes("").slice(0, -1);
  const iter = kv.list<bigint>({ prefix }, { consistency: "eventual" });
  const array = await Array.fromAsync(iter, (it) => {
    return {
      name: it.key.at(-1)!.toString(),
      count: Number(it.value),
    };
  });
  array.sort((a, b) => b.count - a.count);
  return array;
}
