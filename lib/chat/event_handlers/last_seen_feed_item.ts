import { assertLastSeenFeedItemEvent } from "../util/assertions.ts";
import type { ChatEventHandler } from "../util/types.ts";

export const lastSeenFeedItemHandler: ChatEventHandler = (event, conn) => {
  assertLastSeenFeedItemEvent(event);

  conn.lastSeenFeedItemId = event.data.id;

  return null;
};
