import { WEEK } from "@std/datetime";
import type { ChatFeedItem } from "../types.ts";

export const feedItemsKeys = {
  byChat: (
    chatId: string,
    itemId: string,
  ) => ["chat_feed_items", chatId, itemId],

  lastFeedItemIdByChat: (
    chatId: string,
  ) => ["last_chat_feed_item", chatId],
};

export function setChatFeedItem(
  feedItem: ChatFeedItem,
  atomic: Deno.AtomicOperation,
) {
  return atomic
    .set(
      feedItemsKeys.byChat(feedItem.chatId, feedItem.id),
      feedItem,
      { expireIn: WEEK },
    )
    .set(feedItemsKeys.lastFeedItemIdByChat(feedItem.chatId), feedItem.id);
}

export function deleteChatFeedItem(
  feedItem: Pick<ChatFeedItem, "chatId" | "id">,
  kv: Deno.Kv,
) {
  return kv.delete(feedItemsKeys.byChat(feedItem.chatId, feedItem.id));
}

export function deleteLastFeedItemIdByChat(
  chatId: string,
  kv: Deno.Kv,
) {
  return kv.delete(feedItemsKeys.lastFeedItemIdByChat(chatId));
}

export function listFeedItemsByChat(options: {
  kv: Deno.Kv;
  chatId: string;
  listSelector?: Partial<Deno.KvListSelector>;
  listOptions?: Deno.KvListOptions;
}) {
  const { kv, chatId, listSelector, listOptions } = options;
  const prefix = feedItemsKeys.byChat(chatId, "").slice(0, -1);
  const iter = kv.list<ChatFeedItem>({ prefix, ...listSelector }, listOptions);
  return Array.fromAsync(iter, (it) => it.value);
}
