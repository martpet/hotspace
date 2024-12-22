import {
  deleteChatFeedItem,
  deleteChatMessage,
  deleteLastFeedItemIdByChat,
  listChatMessages,
  listFeedItemsByChat,
} from "$chat";
import { deleteQueueNonce, enqueue, getQueueNonce } from "../enqueue.ts";
import { kv } from "../kv.ts";

export interface QueueMsgCleanupChat {
  type: "cleanup-chat";
  chatId: string;
  nonce: string;
}

export function enqueueCleanupChat(
  chatId: string,
  atomic: Deno.AtomicOperation,
) {
  const msg: Omit<QueueMsgCleanupChat, "nonce"> = {
    type: "cleanup-chat",
    chatId,
  };
  return enqueue(msg, atomic);
}

export function isCleanupChat(
  msg: unknown,
): msg is QueueMsgCleanupChat {
  const { type, nonce, chatId } = msg as Partial<QueueMsgCleanupChat>;
  return typeof msg === "object" &&
    type === "cleanup-chat" &&
    typeof nonce === "string" &&
    typeof chatId === "string";
}

export async function handleCleanupChat(msg: QueueMsgCleanupChat) {
  const nonceEntry = await getQueueNonce(msg.nonce);

  if (!nonceEntry.value) {
    return;
  }

  await deleteQueueNonce(msg.nonce);

  await Promise.all([
    deleteChatMessages(msg.chatId),
    deleteChatFeedItems(msg.chatId),
    deleteLastFeedItemIdByChat(msg.chatId, kv),
  ]);
}

async function deleteChatMessages(chatId: string) {
  const { messages } = await listChatMessages({ kv, chatId });
  if (!messages.length) {
    return;
  }
  for (const msg of messages) {
    await deleteChatMessage(msg, kv.atomic()).commit();
  }
}

async function deleteChatFeedItems(chatId: string) {
  const feedItems = await listFeedItemsByChat({ kv, chatId });
  if (!feedItems.length) {
    return;
  }
  for (const item of feedItems) {
    await deleteChatFeedItem(item, kv);
  }
}
