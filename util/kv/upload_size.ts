import type { User } from "../types.ts";
import { kv, toKvSumBigInt } from "./kv.ts";

export const keys = {
  byUser: (userId: string) => ["uploaded_size_by_user", userId],
  totalSize: () => ["uploaded_size"],
};

export function setUploadSize(options: {
  userId: string;
  size: number;
  atomic?: Deno.AtomicOperation;
}) {
  const { userId, size, atomic = kv.atomic() } = options;
  const bigint = toKvSumBigInt(size);

  return atomic
    .sum(keys.byUser(userId), bigint)
    .sum(keys.totalSize(), bigint);
}

export function getUploadSizeByUser(
  user: User,
  consistency?: Deno.KvConsistencyLevel,
) {
  return kv.get<bigint>(keys.byUser(user.id), { consistency });
}
