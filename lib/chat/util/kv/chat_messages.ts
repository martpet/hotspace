import { omit } from "@std/collections";
import { decodeTime } from "@std/ulid";
import type { ChatMessage, RawChatMessage } from "../types.ts";

export const chatMessagesKeys = {
  byChat: (chatId: string, id: string) => ["chat_msgs", chatId, id],

  byUserByChat: (
    userId: string,
    chatId: string,
    id: string,
  ) => ["chat_msgs_by_user", userId, chatId, id],
};

export function setChatMessage(
  msg: RawChatMessage | ChatMessage,
  atomic: Deno.AtomicOperation,
) {
  const rawMsg = dehydrateChatMsg(msg);
  return atomic
    .set(chatMessagesKeys.byChat(rawMsg.chatId, rawMsg.id), rawMsg)
    .set(
      chatMessagesKeys.byUserByChat(rawMsg.username, rawMsg.chatId, rawMsg.id),
      rawMsg,
    );
}

export function deleteChatMessage(
  msg: Pick<ChatMessage, "id" | "chatId" | "username">,
  atomic: Deno.AtomicOperation,
) {
  return atomic
    .delete(chatMessagesKeys.byChat(msg.chatId, msg.id))
    .delete(chatMessagesKeys.byUserByChat(msg.username, msg.chatId, msg.id));
}

export async function getChatMessage(options: {
  kv: Deno.Kv;
  id: string;
  chatId: string;
}) {
  const { kv, id, chatId } = options;
  const entry = await kv.get<RawChatMessage>(
    chatMessagesKeys.byChat(chatId, id),
  );
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
  const prefix = chatMessagesKeys.byChat(chatId, "").slice(0, -1);
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

function dehydrateChatMsg(msg: ChatMessage | RawChatMessage): RawChatMessage {
  return omit(msg as ChatMessage, ["createdAt"]);
}
