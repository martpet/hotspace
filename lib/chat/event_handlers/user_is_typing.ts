import { UserTypingEvent } from "$chat";
import {
  assertChatEntry,
  assertUserEntry,
  assertUserTypingEvent,
} from "../assertions.ts";
import type { ChatEventHandler } from "../types.ts";

export const userTypingHandler: ChatEventHandler<UserTypingEvent> = (
  event,
  conn,
) => {
  const { chat, chatUser } = conn;

  assertUserTypingEvent(event);
  assertChatEntry(chat.kvEntry);
  assertUserEntry(chatUser?.kvEntry);

  conn.sendOthers(event);

  return null;
};
