import { handleCleanupChat, isCleanupChat } from "./cleanup_chat.ts";
import {
  handleDeleteS3Objects,
  isDeleteS3Objects,
} from "./delete_s3_objects.ts";
import {
  handlePushChatNotification,
  isPushChatNotification,
} from "./push_chat_notification.ts";

export function queueHandler(msg: unknown) {
  if (isCleanupChat(msg)) {
    handleCleanupChat(msg);
  } else if (isPushChatNotification(msg)) {
    handlePushChatNotification(msg);
  } else if (isDeleteS3Objects(msg)) {
    handleDeleteS3Objects(msg);
  } else {
    console.error("Unknown KV Queue msg received", msg);
  }
}
