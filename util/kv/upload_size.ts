import type { User } from "../types.ts";
import { getKvSumBigInt, kv } from "./kv.ts";

export const keys = {
  byUser: (userId: string) => ["uploaded_size_by_user", userId],
  totalSize: () => ["uploaded_size"],
};

export function setUploadSize(options: {
  user: User;
  size: number;
  atomic?: Deno.AtomicOperation;
}) {
  const { user, size, atomic = kv.atomic() } = options;
  const bigint = getKvSumBigInt(size);

  return atomic
    .sum(keys.byUser(user.id), bigint)
    .sum(keys.totalSize(), bigint);
}

export function getUploadSizeByUser(
  user: User,
  consistency?: Deno.KvConsistencyLevel,
) {
  return kv.get<bigint>(keys.byUser(user.id), { consistency });
}
