import { DAY } from "@std/datetime/constants";
import type { ChatFeedItem } from "../chat_types.ts";
import { hydrateChatMessage } from "./chat_messages.ts";
import { kv } from "./kv.ts";

export const keys = {
  byChat: (
    parentId: string,
    itemId: string,
  ) => ["chat_feed_items", parentId, itemId],

  lastItemIdByChat: (
    parentId: string,
  ) => ["last_chat_feed_item", parentId],
};

export function setChatFeedItem(
  item: ChatFeedItem,
  atomic = kv.atomic(),
) {
  return atomic
    .set(
      keys.byChat(item.msg.parentId, item.msg.feedItemId),
      item,
      { expireIn: DAY },
    )
    .set(
      keys.lastItemIdByChat(item.msg.parentId),
      item.msg.feedItemId,
    );
}

export async function listChatFeedItems(
  parentId: string,
  selector?: Partial<Deno.KvListSelector>,
  options?: Deno.KvListOptions,
) {
  const prefix = keys.byChat(parentId, "").slice(0, -1);
  const iter = kv.list<ChatFeedItem>({ prefix, ...selector }, options);
  const entries = await Array.fromAsync(iter);
  return entries.map((entry) => {
    const item = entry.value;
    if (item.type === "new-chat-msg") {
      return { ...item, msg: hydrateChatMessage(item.msg) };
    }
    return item;
  });
}
