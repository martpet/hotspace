import {
  handleCleanupChatData,
  isCleanupChatData,
} from "./cleanup_chat_data.ts";
import {
  handlePushChatNotifications,
  isPushChatNotifications,
} from "./push_chat_notifications.ts";

export function queueHandler(msg: unknown) {
  if (isCleanupChatData(msg)) {
    handleCleanupChatData(msg);
  } else if (isPushChatNotifications(msg)) {
    handlePushChatNotifications(msg);
  } else {
    console.error("Unknown KV Queue msg received", msg);
  }
}
