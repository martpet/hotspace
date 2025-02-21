import {
  assertChatEntry,
  assertUserEntry,
  assertUserTypingEvent,
} from "../util/assertions.ts";
import type { ChatEventHandler, UserTypingEvent } from "../util/types.ts";

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
