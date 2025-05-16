import type { FileNode } from "../inodes/types.ts";
import type { User } from "../types.ts";
import { kv, toKvSumBigInt } from "./kv.ts";

export const keys = {
  totalUploadSize: () => ["total_upload_size"],
  uploadSizeByOwner: (userId: string) => ["upload_size_by_user", userId],
  mimeTypes: (mimeType: string) => ["mime_types", mimeType],
};

export function setFileNodeStats(options: {
  fileNode: FileNode;
  isAdd: boolean;
  atomic?: Deno.AtomicOperation;
}) {
  const { fileNode, isAdd, atomic = kv.atomic() } = options;
  const fileSizeChange = toKvSumBigInt(
    isAdd ? fileNode.fileSize : fileNode.fileSize * -1,
  );
  const fileTypeCountChange = toKvSumBigInt(isAdd ? 1 : -1);

  return atomic
    .sum(keys.totalUploadSize(), fileSizeChange)
    .sum(keys.uploadSizeByOwner(fileNode.ownerId), fileSizeChange)
    .sum(keys.mimeTypes(fileNode.mimeType), fileTypeCountChange);
}

export function deleteuploadSizeByOwner(userId: string) {
  return kv.delete(keys.uploadSizeByOwner(userId));
}

export function getuploadSizeByOwner(
  user: User,
  options: { consistency?: Deno.KvConsistencyLevel } = {},
) {
  const { consistency } = options;
  return kv.get<bigint>(keys.uploadSizeByOwner(user.id), { consistency });
}
