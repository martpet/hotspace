import { omit } from "@std/collections";
import { decodeTime } from "@std/ulid";
import type { ChatMessage, RawChatMessage } from "../types.ts";

const keys = {
  byChat: (chatId: string, id: string) => ["chat_msgs", chatId, id],
  byUser: (userId: string, id: string) => ["chat_msgs_by_user", userId, id],
  byUserByChat: (
    userId: string,
    chatId: string,
    id: string,
  ) => ["chat_msgs_by_user_by_chat", userId, chatId, id],
};

export function setChatMessage(
  msg: RawChatMessage | ChatMessage,
  atomic: Deno.AtomicOperation,
) {
  const rawMsg = dehydrateChatMsg(msg);
  const { chatId, id, userId } = rawMsg;
  return atomic
    .set(keys.byChat(chatId, id), rawMsg)
    .set(keys.byUser(userId, id), rawMsg)
    .set(keys.byUserByChat(userId, chatId, id), rawMsg);
}

export function deleteChatMessage(
  msg: Pick<ChatMessage, "id" | "chatId" | "userId">,
  atomic: Deno.AtomicOperation,
) {
  const { chatId, id, userId } = msg;
  return atomic
    .delete(keys.byChat(chatId, id))
    .delete(keys.byUser(userId, id))
    .delete(keys.byUserByChat(userId, chatId, id));
}

export async function getChatMessage(options: {
  kv: Deno.Kv;
  id: string;
  chatId: string;
}) {
  const { kv, id, chatId } = options;
  const entry = await kv.get<RawChatMessage>(keys.byChat(chatId, id));
  return entry.versionstamp === null ? entry : hydrateChatMsgEntry(entry);
}

export async function listChatMessages(
  options: {
    chatId: string;
    kv: Deno.Kv;
    listOptions?: Deno.KvListOptions;
  },
) {
  const { chatId, kv, listOptions = {} } = options;
  const prefix = keys.byChat(chatId, "").slice(0, -1);
  const { limit } = listOptions;
  const iter = kv.list<RawChatMessage>({ prefix }, {
    ...listOptions,
    limit: limit ? limit + 1 : undefined,
  });
  const messages: ChatMessage[] = [];
  let nextCursor: string | null = null;
  let index = 1;
  for await (const entry of iter) {
    messages.push(hydrateChatMsgEntry(entry).value);
    if (index === limit) nextCursor = iter.cursor;
    index++;
  }
  if (limit && messages.length > limit) {
    messages.pop();
  } else {
    nextCursor = null;
  }
  return { messages, nextCursor };
}

export function hydrateChatMsgEntry(
  entry: Deno.KvEntry<RawChatMessage>,
): Deno.KvEntry<ChatMessage> {
  return {
    ...entry,
    value: {
      ...entry.value,
      createdAt: new Date(decodeTime(entry.value.id)),
    },
  };
}

export function listChatMessagesByUser(userId: string, kv: Deno.Kv) {
  const prefix = keys.byUser(userId, "").slice(0, -1);
  const iter = kv.list<ChatMessage>({ prefix });
  return Array.fromAsync(iter, (it) => it.value);
}

function dehydrateChatMsg(msg: ChatMessage | RawChatMessage): RawChatMessage {
  return omit(msg as ChatMessage, ["createdAt"]);
}
