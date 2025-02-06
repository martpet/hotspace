import {
  deleteChatFeedItem,
  deleteChatMessage,
  deleteChatSub,
  deleteLastFeedItemIdByChat,
  listChatMessages,
  listChatSubs,
  listFeedItemsByChat,
} from "$chat";
import { kv } from "../kv.ts";

export interface QueueMsgDeleteChat {
  type: "delete-chat";
  chatId: string;
}

export function isDeleteChat(msg: unknown): msg is QueueMsgDeleteChat {
  const { type, chatId } = msg as Partial<QueueMsgDeleteChat>;
  return typeof msg === "object" &&
    type === "delete-chat" &&
    typeof chatId === "string";
}

export function handleDeleteChat({ chatId }: QueueMsgDeleteChat) {
  return Promise.all([
    deleteChatMessages(chatId),
    deleteChatFeedItems(chatId),
    deleteChatSubs(chatId),
    deleteLastFeedItemIdByChat(chatId, kv),
  ]);
}

async function deleteChatMessages(chatId: string) {
  const { messages } = await listChatMessages({ kv, chatId });
  for (const msg of messages) {
    await deleteChatMessage(msg, kv.atomic()).commit();
  }
}

async function deleteChatFeedItems(chatId: string) {
  const items = await listFeedItemsByChat({ kv, chatId });
  for (const item of items) {
    await deleteChatFeedItem(item, kv);
  }
}

async function deleteChatSubs(chatId: string) {
  const subs = await listChatSubs({ kv, chatId });
  for (const sub of subs) {
    await deleteChatSub(sub, kv.atomic()).commit();
  }
}
