import { listChatMessagesByUser, setDeletedChatMessage } from "$chat";
import { newQueue } from "@henrygd/queue";
import { deleteInodesRecursive } from "../../util/inodes/kv_wrappers.ts";
import { deleteuploadSizeByOwner } from "../../util/kv/filenodes_stats.ts";
import { listRootDirsByOwner } from "../../util/kv/inodes.ts";
import { kv } from "../../util/kv/kv.ts";
import { deletePasskey, listPasskeysByUser } from "../../util/kv/passkeys.ts";
import { deleteSession, listSessionsByUser } from "../../util/kv/sessions.ts";
import {
  deleteSubscriberByUserId,
  listSubscribersByUserId,
} from "../kv/push_subscribers.ts";

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
  const chatMessages = await listChatMessagesByUser(username, kv);
  const pushSubs = await listSubscribersByUserId(userId);

  const queue = newQueue(5);

  queue.add(() => deleteInodesRecursive(inodes));

  queue.add(() => deleteuploadSizeByOwner(userId));

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

  for (const pushSub of pushSubs) {
    queue.add(() => deleteSubscriberByUserId(userId, pushSub.id));
  }

  return queue.done();
}
