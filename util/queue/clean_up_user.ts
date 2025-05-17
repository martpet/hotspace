import { listChatMessagesByUser, setDeletedChatMessage } from "$chat";
import { newQueue } from "@henrygd/queue";
import { deleteInodesRecursive } from "../../util/inodes/kv_wrappers.ts";
import {
  keys as getInodeKvKey,
  listRootDirsByOwner,
} from "../../util/kv/inodes.ts";
import { getManyEntries, kv } from "../../util/kv/kv.ts";
import { deletePasskey, listPasskeysByUser } from "../../util/kv/passkeys.ts";
import { deleteSession, listSessionsByUser } from "../../util/kv/sessions.ts";
import { applyAclDiffs } from "../inodes/acl.ts";
import type { Inode } from "../inodes/types.ts";
import {
  deleteInAclOfNotOwnInode,
  listInAclNotOwnInodeIds,
} from "../kv/acl.ts";
import { deleteUploadStatsByUser } from "../kv/uploads_stats.ts";

export interface QueueMsgCleanUpUser {
  type: "clean-up-user";
  userId: string;
  username: string;
}

export function isCleanUpUser(msg: unknown): msg is QueueMsgCleanUpUser {
  const { type, userId, username } = msg as Partial<QueueMsgCleanUpUser>;
  return typeof msg === "object" &&
    type === "clean-up-user" &&
    typeof userId === "string" &&
    typeof username === "string";
}

export async function handleCleanUpUser(msg: QueueMsgCleanUpUser) {
  const { userId, username } = msg;

  const inodes = await listRootDirsByOwner(userId);
  const passkeys = await listPasskeysByUser(userId);
  const sessions = await listSessionsByUser(userId);
  const chatMessages = await listChatMessagesByUser(userId, kv);
  const inAclNotOwnInodeIds = await listInAclNotOwnInodeIds(userId);

  const queue = newQueue(5);

  queue.add(() => deleteInodesRecursive(inodes));

  queue.add(() => deleteUploadStatsByUser(userId));

  for (const passkey of passkeys) {
    queue.add(() => deletePasskey(passkey).commit());
  }

  for (const session of sessions) {
    queue.add(() => deleteSession(session).commit());
  }

  for (const msg of chatMessages) {
    queue.add(() => {
      return setDeletedChatMessage({ msg, atomic: kv.atomic() }).commit();
    });
  }

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

  return queue.done();
}
