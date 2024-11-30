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
  const { chatId, chatEntry, kv } = conn;
  assertLoadOlderMessagesEvent(event);
  assertChatEntry(chatEntry);

  const { olderMsgsCursor } = event.data;

  const { messages, nextCursor } = await listChatMessages({
    chatId,
    kv,
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
