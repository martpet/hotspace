import { decodeTime, ulid } from "@std/ulid";
import {
  assertChatEntry,
  assertNewChatMsgEvent,
  assertUserEntry,
} from "../util/assertions.ts";
import { setNewChatMessage } from "../util/kv/chat_messages_wrappers.ts";
import sanitizeChatMsgText from "../util/sanitize_msg.ts";
import type {
  ChatEventHandler,
  ChatMessage,
  NewChatMsgEventResp,
  QueueMsgPushChatNotification,
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
  const { canRead } = conn.permissions;

  if (!canRead) {
    return null;
  }

  const msg: ChatMessage = {
    id,
    chatId: chat.id,
    feedItemId,
    username: chatUser.kvEntry.value.username,
    text: sanitizeChatMsgText(text),
    createdAt: new Date(decodeTime(id)),
  };

  const kvQueueMsg: QueueMsgPushChatNotification = {
    type: "push-chat-notification",
    chatId: chat.id,
    chatMsgId: msg.id,
    chatPageUrl: chat.location,
    chatTitle: chat.title,
    nonce: crypto.randomUUID(),
  };

  const atomic = kv.atomic();
  atomic.check(chat.kvEntry, chatUser.kvEntry);
  setNewChatMessage({ msg, clientMsgId, atomic });
  const commit = await atomic.commit();

  if (!commit.ok) {
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
