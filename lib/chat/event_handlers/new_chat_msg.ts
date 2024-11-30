import { pick } from "@std/collections";
import { decodeTime, ulid } from "@std/ulid";
import {
  assertChatEntry,
  assertNewChatMsgEvent,
  assertUserEntry,
} from "../assertions.ts";
import { setChatFeedItem } from "../kv/chat_feed_items.ts";
import { setChatMessage } from "../kv/chat_messages.ts";
import sanitizeChatMsgText from "../sanitize_msg.ts";
import type {
  ChatEventHandler,
  ChatMessage,
  NewChatMsgEventResp,
  NewChatMsgFeedItem,
  QueueMsgChatMsgPush,
} from "../types.ts";

export const newChatMsgHandler: ChatEventHandler<NewChatMsgEventResp> = async (
  event,
  conn,
) => {
  const { chatId, chatEntry, userEntry, kv, enqueue } = conn;
  assertNewChatMsgEvent(event);
  assertChatEntry(chatEntry);
  assertUserEntry(userEntry);

  const { clientMsgId, text } = event.data;
  const id = ulid();
  const feedItemId = ulid();

  const msg: ChatMessage = {
    id,
    chatId,
    feedItemId,
    username: userEntry.value.username,
    text: sanitizeChatMsgText(text),
    createdAt: new Date(decodeTime(id)),
  };

  const feedItem: NewChatMsgFeedItem = {
    type: "new-chat-msg",
    id: feedItemId,
    chatId,
    data: {
      clientMsgId,
      ...pick(msg, [
        "id",
        "username",
        "text",
        "createdAt",
      ]),
    },
  };

  const kvQueueMsg: Omit<QueueMsgChatMsgPush, "nonce"> = {
    type: "push-chat-notifications",
    chatId,
    chatMsgId: msg.id,
    chatUrl: conn.chatUrl,
    pageTitle: conn.pageTitle,
  };

  const atomic = kv.atomic();
  setChatMessage(msg, atomic);
  setChatFeedItem(feedItem, atomic);

  const { ok } = await atomic
    .check(chatEntry, userEntry)
    .commit();

  if (!ok) {
    return newChatMsgHandler(event, conn);
  }

  conn.chat.checkHasSubs().then((hasSubs) => {
    if (hasSubs) enqueue(kvQueueMsg, kv.atomic()).commit();
  });

  return {
    type: "new-chat-msg-resp",
    data: { id, clientMsgId },
  };
};
