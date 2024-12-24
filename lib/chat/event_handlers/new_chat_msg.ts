import { pick } from "@std/collections";
import { decodeTime, ulid } from "@std/ulid";
import {
  assertChatEntry,
  assertNewChatMsgEvent,
  assertUserEntry,
} from "../util/assertions.ts";
import { setChatFeedItem } from "../util/kv/chat_feed_items.ts";
import { setChatMessage } from "../util/kv/chat_messages.ts";
import sanitizeChatMsgText from "../util/sanitize_msg.ts";
import type {
  ChatEventHandler,
  ChatMessage,
  NewChatMsgEventResp,
  NewChatMsgFeedItem,
  PushChatNotificationQueueMsg,
} from "../util/types.ts";

export const newChatMsgHandler: ChatEventHandler<NewChatMsgEventResp> = async (
  event,
  conn,
) => {
  const { chat, chatUser, kv, kvEnqueue } = conn;
  assertNewChatMsgEvent(event);
  assertChatEntry(chat.kvEntry);
  assertUserEntry(chatUser?.kvEntry);

  const { clientMsgId, text } = event.data;
  const id = ulid();
  const feedItemId = ulid();

  const msg: ChatMessage = {
    id,
    chatId: chat.id,
    feedItemId,
    username: chatUser.kvEntry.value.username,
    text: sanitizeChatMsgText(text),
    createdAt: new Date(decodeTime(id)),
  };

  const feedItem: NewChatMsgFeedItem = {
    type: "new-chat-msg",
    id: feedItemId,
    chatId: chat.id,
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

  const kvQueueMsg: Omit<PushChatNotificationQueueMsg, "nonce"> = {
    type: "push-chat-notification",
    chatId: chat.id,
    chatMsgId: msg.id,
    chatPageUrl: chat.location,
    chatTitle: chat.title,
  };

  const atomic = kv.atomic();
  setChatMessage(msg, atomic);
  setChatFeedItem(feedItem, atomic);

  const { ok } = await atomic
    .check(chat.kvEntry, chatUser.kvEntry)
    .commit();

  if (!ok) {
    return newChatMsgHandler(event, conn);
  }

  conn.chat.checkHasSubs().then((hasSubs) => {
    if (hasSubs) kvEnqueue(kvQueueMsg, kv.atomic()).commit();
  });

  return {
    type: "new-chat-msg-resp",
    data: { id, clientMsgId },
  };
};
