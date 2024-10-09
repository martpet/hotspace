import { decodeTime } from "@std/ulid/decode-time";
import type { ChatMessage, RawChatMessage } from "../chat_types.ts";
import { kv } from "./kv.ts";

export const keys = {
  byChat: (parentId: string, id: string) => ["chat_msgs", parentId, id],

  byUserByChat: (
    userId: string,
    parentId: string,
    id: string,
  ) => ["chat_msgs_by_user", userId, parentId, id],
};

export function setChatMessage(item: RawChatMessage, atomic = kv.atomic()) {
  return atomic
    .set(keys.byChat(item.parentId, item.id), item)
    .set(keys.byUserByChat(item.userId, item.parentId, item.id), item);
}

export function deleteChatMessage(
  item: Pick<ChatMessage, "id" | "parentId" | "userId">,
  atomic = kv.atomic(),
) {
  return atomic
    .delete(keys.byChat(item.parentId, item.id))
    .delete(keys.byUserByChat(item.userId, item.parentId, item.id));
}

export function getChatMessage(data: Pick<ChatMessage, "id" | "parentId">) {
  return kv.get<RawChatMessage>(keys.byChat(data.parentId, data.id));
}

export async function listChatMessages(
  parentId: string,
  options?: Deno.KvListOptions,
) {
  const prefix = keys.byChat(parentId, "").slice(0, -1);
  const iter = kv.list<RawChatMessage>({ prefix }, options);
  const entires = await Array.fromAsync(iter);
  return entires.map(({ value }) => hydrateChatMessage(value));
}

export function hydrateChatMessage(msg: RawChatMessage): ChatMessage {
  return {
    ...msg,
    createdAt: new Date(decodeTime(msg.id)),
  };
}
