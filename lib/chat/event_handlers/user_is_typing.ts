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
  assertUserTypingEvent(event);
  assertChatEntry(conn.chatEntry);
  assertUserEntry(conn.userEntry);

  conn.sendOthers(event);

  return null;
};
