import type { User } from "../types.ts";
import { kv, toKvSumBigInt } from "./kv.ts";

export const keys = {
  total: () => ["total_upload_size"],
  byUser: (userId: string) => ["upload_size_by_user", userId],
};

export function setUploadSize(options: {
  userId: string;
  size: number;
  atomic?: Deno.AtomicOperation;
}) {
  const { userId, size, atomic = kv.atomic() } = options;
  const bigint = toKvSumBigInt(size);

  return atomic
    .sum(keys.total(), bigint)
    .sum(keys.byUser(userId), bigint);
}

export function deleteUploadSizeByUser(userId: string) {
  return kv.delete(keys.byUser(userId));
}

export function getUploadSizeByUser(
  user: User,
  options: { consistency?: Deno.KvConsistencyLevel } = {},
) {
  const { consistency } = options;
  return kv.get<bigint>(keys.byUser(user.id), { consistency });
}
