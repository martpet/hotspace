import type { FileNode } from "../inodes/types.ts";
import type { User } from "../types.ts";
import { kv, toKvSumBigInt } from "./kv.ts";

const keys = {
  storedBytes: () => ["stored_bytes"],
  storedBytesByUser: (id: string) => ["stored_bytes_by_user", id],
  totalUploadedBytes: () => ["total_upload_bytes"],
  totalUploadedBytesByUser: (id: string) => ["total_upload_bytes_by_user", id],
  mimeTypes: (mimeType: string) => ["mime_types", mimeType],
};

export function setUploadStats(options: {
  fileNode: FileNode;
  isAdd: boolean;
  atomic?: Deno.AtomicOperation;
}) {
  const { fileNode, isAdd, atomic = kv.atomic() } = options;
  const { fileSize } = fileNode;
  const bytesDiff = toKvSumBigInt(isAdd ? fileSize : fileSize * -1);
  const mimeDiff = toKvSumBigInt(isAdd ? 1 : -1);

  atomic
    .sum(keys.storedBytes(), bytesDiff)
    .sum(keys.storedBytesByUser(fileNode.ownerId), bytesDiff)
    .sum(keys.mimeTypes(fileNode.mimeType), mimeDiff);

  if (isAdd) {
    atomic.sum(keys.totalUploadedBytes(), bytesDiff);
    atomic.sum(keys.totalUploadedBytesByUser(fileNode.ownerId), bytesDiff);
  }

  return atomic;
}

export async function getTotalUploadedBytesByUser(
  user: User,
  options: { consistency?: Deno.KvConsistencyLevel } = {},
) {
  const { consistency } = options;
  const { value: bytes } = await kv.get<bigint>(
    keys.totalUploadedBytesByUser(user.id),
    { consistency },
  );
  return Number(bytes);
}

export async function deleteUploadStatsByUser(userId: string) {
  await kv.delete(keys.storedBytesByUser(userId));
  await kv.delete(keys.totalUploadedBytesByUser(userId));
}
