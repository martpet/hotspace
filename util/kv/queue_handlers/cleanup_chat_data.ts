// TODO: delete chat subs

import {
  deleteChatFeedItem,
  deleteChatMessage,
  deleteLastFeedItemIdByChat,
  listChatMessages,
  listFeedItemsByChat,
} from "$chat";
import { deleteQueueNonce, enqueue, getQueueNonce } from "../enqueue.ts";
import { kv } from "../kv.ts";

export interface QueueMsgCleanupChatData {
  type: "cleanup-chat-data";
  chatId: string;
  nonce: string;
}

export function enqueueCleanupChatData(
  chatId: string,
  atomic: Deno.AtomicOperation,
) {
  const msg: Omit<QueueMsgCleanupChatData, "nonce"> = {
    type: "cleanup-chat-data",
    chatId,
  };
  return enqueue(msg, atomic);
}

export function isCleanupChatData(
  msg: unknown,
): msg is QueueMsgCleanupChatData {
  const { type, nonce, chatId } = msg as Partial<QueueMsgCleanupChatData>;
  return typeof msg === "object" &&
    type === "cleanup-chat-data" &&
    typeof nonce === "string" &&
    typeof chatId === "string";
}

export async function handleCleanupChatData(msg: QueueMsgCleanupChatData) {
  const nonce = (await getQueueNonce(msg.nonce)).value;
  if (nonce === null) return;
  await deleteQueueNonce(nonce);

  await Promise.all([
    deleteChatMessages(msg.chatId),
    deleteChatFeedItems(msg.chatId),
    deleteLastFeedItemIdByChat(msg.chatId, kv),
  ]);
}

async function deleteChatMessages(chatId: string) {
  const { messages } = await listChatMessages({
    kv,
    chatId,
    listOptions: { limit: 500 },
  });
  if (!messages.length) {
    return;
  }
  for (const msg of messages) {
    await deleteChatMessage(msg, kv.atomic()).commit();
  }
  return deleteChatMessages(chatId);
}

async function deleteChatFeedItems(chatId: string) {
  const feedItems = await listFeedItemsByChat({
    kv,
    chatId,
    listOptions: { limit: 500 },
  });
  if (!feedItems.length) {
    return;
  }
  for (const item of feedItems) {
    await deleteChatFeedItem(item, kv);
  }
  return deleteChatFeedItems(chatId);
}
