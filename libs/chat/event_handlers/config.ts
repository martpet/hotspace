import { AsyncQueue } from "$util";
import type { HandlerConfig, InboundChatEvent } from "../util/types.ts";
import { deletedChatMsgHandler } from "./delete_chat_msg.ts";
import { editedChatMsgHandler } from "./edit_chat_msg.ts";
import { lastSeenFeedItemHandler } from "./last_seen_feed_item.ts";
import { loadOlderMessagesHandler } from "./load_older_messages.ts";
import { newChatMsgHandler } from "./new_chat_msg.ts";
import { subscriberOnlineHandler } from "./subscriber_online.ts";
import { userTypingHandler } from "./user_is_typing.ts";

const chatMsgQueue = new AsyncQueue();

export const config = new Map<
  InboundChatEvent["type"],
  HandlerConfig
>();

config.set("new-chat-msg", {
  handler: newChatMsgHandler,
  options: { queue: chatMsgQueue },
});

config.set("edited-chat-msg", {
  handler: editedChatMsgHandler,
  options: { queue: chatMsgQueue },
});

config.set("deleted-chat-msg", {
  handler: deletedChatMsgHandler,
  options: { queue: chatMsgQueue },
});

config.set("last-seen-feed-item", {
  handler: lastSeenFeedItemHandler,
});

config.set("load-older-messages", {
  handler: loadOlderMessagesHandler,
});

config.set("user-typing", {
  handler: userTypingHandler,
});

config.set("subscriber-online", {
  handler: subscriberOnlineHandler,
});
