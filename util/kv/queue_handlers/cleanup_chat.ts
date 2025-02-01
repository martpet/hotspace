import {
  deleteChatFeedItem,
  deleteChatMessage,
  deleteChatSub,
  deleteLastFeedItemIdByChat,
  listChatMessages,
  listChatSubs,
  listFeedItemsByChat,
} from "$chat";
import { deleteQueueNonce, enqueue, getQueueNonce } from "../enqueue.ts";
import { kv } from "../kv.ts";

export interface CleanupChatQueueMsg {
  type: "cleanup-chat";
  chatId: string;
  nonce: string;
}

export function enqueueCleanupChat(
  chatId: string,
  atomic?: Deno.AtomicOperation,
) {
  const msg: Omit<CleanupChatQueueMsg, "nonce"> = {
    type: "cleanup-chat",
    chatId,
  };
  return enqueue(msg, atomic);
}

export function isCleanupChat(
  msg: unknown,
): msg is CleanupChatQueueMsg {
  const { type, nonce, chatId } = msg as Partial<CleanupChatQueueMsg>;
  return typeof msg === "object" &&
    type === "cleanup-chat" &&
    typeof nonce === "string" &&
    typeof chatId === "string";
}

export async function handleCleanupChat(msg: CleanupChatQueueMsg) {
  const { nonce, chatId } = msg;
  const nonceEntry = await getQueueNonce(nonce);
  if (!nonceEntry.value) return;

  await Promise.all([
    deleteQueueNonce(nonce),
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
