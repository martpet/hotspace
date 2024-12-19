import { listChatMessages } from "$chat";
import {
  assertChatEntry,
  assertLoadOlderMessagesEvent,
} from "../assertions.ts";
import { MESSAGES_PER_FETCH } from "../consts.ts";
import type { ChatEventHandler, LoadOlderMessagesEventResp } from "../types.ts";

export const loadOlderMessagesHandler: ChatEventHandler<
  LoadOlderMessagesEventResp
> = async (event, conn) => {
  const { chat, kv } = conn;
  assertLoadOlderMessagesEvent(event);
  assertChatEntry(chat.kvEntry);

  const { olderMsgsCursor } = event.data;

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
