import { handleChatPush, isChatPush } from "./chat_push.ts";
import {
  handleCleanupChatData,
  isCleanupChatData,
} from "./cleanup_chat_data.ts";

export function queueHandler(msg: unknown) {
  if (isCleanupChatData(msg)) {
    handleCleanupChatData(msg);
  } else if (isChatPush(msg)) {
    handleChatPush(msg);
  } else {
    console.error("Unknown KV Queue msg received", msg);
  }
}
