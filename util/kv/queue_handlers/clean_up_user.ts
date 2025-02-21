import { newQueue } from "@henrygd/queue";
import { deleteUserSpaces } from "../../inodes_helpers.ts";
import { deletePasskey, listPasskeysByUser } from "../passkeys.ts";
import { deleteSession, listSessionsByUser } from "../sessions.ts";
import { deleteUploadSizeByUser } from "../upload_size.ts";

export interface QueueMsgCleanUpUser {
  type: "clean-up-user";
  userId: string;
}

export function isCleanUpUser(msg: unknown): msg is QueueMsgCleanUpUser {
  const { type, userId } = msg as Partial<QueueMsgCleanUpUser>;
  return typeof msg === "object" &&
    type === "clean-up-user" &&
    typeof userId === "string";
}

export async function handleCleanUpUser({ userId }: QueueMsgCleanUpUser) {
  const passkeys = await listPasskeysByUser(userId);
  const sessions = await listSessionsByUser(userId);

  const queue = newQueue(5);

  queue.add(() => deleteUserSpaces(userId));

  queue.add(() => deleteUploadSizeByUser(userId));

  for (const passkey of passkeys) {
    queue.add(() => deletePasskey(passkey).commit());
  }

  for (const session of sessions) {
    queue.add(() => deleteSession(session).commit());
  }

  return queue.done();
}
