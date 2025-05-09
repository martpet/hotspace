import {
  assertChatEntry,
  assertLoadOlderMessagesEvent,
} from "../util/assertions.ts";
import { MESSAGES_PER_FETCH } from "../util/consts.ts";
import { listChatMessages } from "../util/kv/chat_messages.ts";
import type {
  ChatEventHandler,
  LoadOlderMessagesEventResp,
} from "../util/types.ts";

export const loadOlderMessagesHandler: ChatEventHandler<
  LoadOlderMessagesEventResp
> = async (event, conn) => {
  const { chat, kv } = conn;
  assertLoadOlderMessagesEvent(event);
  assertChatEntry(chat.kvEntry);

  const { olderMsgsCursor } = event.data;
  const { canRead } = conn.perm;

  if (!canRead) {
    return null;
  }

  const { messages, nextCursor } = await listChatMessages({
    kv,
    chatId: chat.id,
    listOptions: {
      cursor: olderMsgsCursor,
      limit: MESSAGES_PER_FETCH,
      consistency: "eventual",
      reverse: true,
    },
  });

  return {
    type: "load-older-messages-resp",
    data: {
      messages: messages.reverse(),
      nextCursor,
    },
  };
};
