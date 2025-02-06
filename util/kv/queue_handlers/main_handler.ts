import { handleDeleteChat, isDeleteChat } from "./delete_chat.ts";
import {
  handleDeleteS3Objects,
  isDeleteS3Objects,
} from "./delete_s3_objects.ts";
import {
  handlePushChatNotification,
  isPushChatNotification,
} from "./push_chat_notification.ts";

export function queueHandler(msg: unknown) {
  if (isDeleteChat(msg)) {
    return handleDeleteChat(msg);
  } else if (isPushChatNotification(msg)) {
    return handlePushChatNotification(msg);
  } else if (isDeleteS3Objects(msg)) {
    return handleDeleteS3Objects(msg);
  } else {
    console.error("Unknown KV Queue msg received", msg);
  }
}
