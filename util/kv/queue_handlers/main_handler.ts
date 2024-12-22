import { handleCleanupChat, isCleanupChat } from "./cleanup_chat.ts";
import {
  handlePushChatNotification,
  isPushChatNotification,
} from "./push_chat_notification.ts";

export function queueHandler(msg: unknown) {
  if (isCleanupChat(msg)) {
    handleCleanupChat(msg);
  } else if (isPushChatNotification(msg)) {
    handlePushChatNotification(msg);
  } else {
    console.error("Unknown KV Queue msg received", msg);
  }
}
