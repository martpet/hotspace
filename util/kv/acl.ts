import { type Queue } from "@henrygd/queue";
import { applyAclDiffs } from "../inodes/acl.ts";
import type { Inode } from "../inodes/types.ts";
import { keys as getInodeKvKey } from "./inodes.ts";
import { getManyEntries, kv } from "./kv.ts";

const keys = {
  inAclNotOwnInodes: (
    userId: string,
    inodeId: string,
  ) => ["in_acl_not_own_inodes", userId, inodeId],
};

export function setInAclNotOwnInode(opt: {
  userId: string;
  inodeId: string;
  atomic: Deno.AtomicOperation;
}) {
  const { userId, inodeId, atomic } = opt;
  return atomic.set(keys.inAclNotOwnInodes(userId, inodeId), "");
}

export function deleteInAclOfNotOwnInode(opt: {
  userId: string;
  inodeId: string;
  atomic?: Deno.AtomicOperation;
}) {
  const { userId, inodeId, atomic = kv.atomic() } = opt;
  return atomic.delete(keys.inAclNotOwnInodes(userId, inodeId));
}

export async function listInAclNotOwnInodeIds(userId: string) {
  const prefix = keys.inAclNotOwnInodes(userId, "").slice(0, -1);
  const iter = kv.list({ prefix });
  const ids = [];
  for await (const entry of iter) ids.push(entry.key.at(-1) as string);
  return ids;
}

export async function cleanupUserAcl(opt: {
  userId: string;
  username: string;
  queue: Queue;
}) {
  const { userId, username, queue } = opt;
  const inAclNotOwnInodeIds = await listInAclNotOwnInodeIds(userId);
  const inAclNotOwnInodeKeys: Deno.KvKey[] = [];

  for (const inodeId of inAclNotOwnInodeIds) {
    queue.add(() => deleteInAclOfNotOwnInode({ userId, inodeId }).commit());
    inAclNotOwnInodeKeys.push(getInodeKvKey.byId(inodeId));
  }

  queue.add(async () => {
    const entries = await getManyEntries<Inode>(inAclNotOwnInodeKeys);
    for (const entry of entries) {
      if (!entry.value?.acl[userId]) continue;
      queue.add(() =>
        applyAclDiffs({
          diffs: [{ userId, role: null }],
          inodeEntry: entry,
          actingUserId: entry.value.ownerId,
          users: [{ id: userId, username }],
          recursive: false,
        })
      );
    }
  });
}
