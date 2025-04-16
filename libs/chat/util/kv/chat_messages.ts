import { omit } from "@std/collections";
import { decodeTime } from "@std/ulid";
import type { ChatMessage, RawChatMessage } from "../types.ts";

const keys = {
  byChat: (chatId: string, id: string) => ["chat_msgs", chatId, id],
  byUser: (username: string, id: string) => ["chat_msgs_by_user", username, id],
  byUserByChat: (
    username: string,
    chatId: string,
    id: string,
  ) => ["chat_msgs_by_user_by_chat", username, chatId, id],
};

export function setChatMessage(
  msg: RawChatMessage | ChatMessage,
  atomic: Deno.AtomicOperation,
) {
  const rawMsg = dehydrateChatMsg(msg);
  const { chatId, id, username } = rawMsg;
  return atomic
    .set(keys.byChat(chatId, id), rawMsg)
    .set(keys.byUser(username, id), rawMsg)
    .set(keys.byUserByChat(username, chatId, id), rawMsg);
}

export function deleteChatMessage(
  msg: Pick<ChatMessage, "id" | "chatId" | "username">,
  atomic: Deno.AtomicOperation,
) {
  const { chatId, id, username } = msg;
  return atomic
    .delete(keys.byChat(chatId, id))
    .delete(keys.byUser(username, id))
    .delete(keys.byUserByChat(username, chatId, id));
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

export async function listChatMessagesByUser(username: string, kv: Deno.Kv) {
  const prefix = keys.byUser(username, "").slice(0, -1);
  const iter = kv.list<ChatMessage>({ prefix });
  const entries = await Array.fromAsync(iter);
  return entries.map((x) => x.value);
}

function dehydrateChatMsg(msg: ChatMessage | RawChatMessage): RawChatMessage {
  return omit(msg as ChatMessage, ["createdAt"]);
}
