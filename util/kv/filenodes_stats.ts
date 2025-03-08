import type { FileNode, User } from "../types.ts";
import { kv, toKvSumBigInt } from "./kv.ts";

export const keys = {
  totalUploadSize: () => ["total_upload_size"],
  uploadSizeByUser: (userId: string) => ["upload_size_by_user", userId],
  fileTypesCount: (fileType: string) => ["file_types_count", fileType],
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
    .sum(keys.uploadSizeByUser(fileNode.ownerId), fileSizeChange)
    .sum(keys.fileTypesCount(fileNode.fileType), fileTypeCountChange);
}

export function deleteUploadSizeByUser(userId: string) {
  return kv.delete(keys.uploadSizeByUser(userId));
}

export function getUploadSizeByUser(
  user: User,
  options: { consistency?: Deno.KvConsistencyLevel } = {},
) {
  const { consistency } = options;
  return kv.get<bigint>(keys.uploadSizeByUser(user.id), { consistency });
}
