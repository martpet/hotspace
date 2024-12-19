import { assertLastSeenFeedItemEvent } from "../assertions.ts";
import type { ChatEventHandler } from "../types.ts";

export const lastSeenFeedItemHandler: ChatEventHandler = (event, conn) => {
  assertLastSeenFeedItemEvent(event);

  conn.lastSeenFeedItemId = event.data.id;

  return null;
};
