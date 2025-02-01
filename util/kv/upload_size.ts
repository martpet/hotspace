import type { User } from "../types.ts";
import { kv } from "./kv.ts";

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
  const bigintSize = BigInt(size);
  return atomic
    .sum(keys.byUser(user.id), bigintSize)
    .sum(keys.totalSize(), bigintSize);
}

export function getUploadSizeByUser(user: User) {
  return kv.get<bigint>(keys.byUser(user.id));
}
