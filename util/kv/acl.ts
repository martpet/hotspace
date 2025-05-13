import { kv } from "./kv.ts";

const keys = {
  inAclNotOwnInodes: (
    userId: string,
    inodeId: string,
  ) => ["in_acl_not_own_inodes", userId, inodeId],
};

export function setInAclNotOwnInode(input: {
  userId: string;
  inodeId: string;
  atomic: Deno.AtomicOperation;
}) {
  const { userId, inodeId, atomic } = input;
  return atomic.set(keys.inAclNotOwnInodes(userId, inodeId), "");
}

export function deleteInAclOfNotOwnInode(input: {
  userId: string;
  inodeId: string;
  atomic?: Deno.AtomicOperation;
}) {
  const { userId, inodeId, atomic = kv.atomic() } = input;
  return atomic.delete(keys.inAclNotOwnInodes(userId, inodeId));
}

export async function listInAclNotOwnInodeIds(userId: string) {
  const prefix = keys.inAclNotOwnInodes(userId, "").slice(0, -1);
  const iter = kv.list({ prefix });
  const ids = [];
  for await (const entry of iter) ids.push(entry.key.at(-1) as string);
  return ids;
}
