import { handleDeleteChat, isDeleteChat } from "./delete_chat.ts";
import {
  handleDeleteS3Objects,
  isDeleteS3Objects,
} from "./delete_s3_objects.ts";
import {
  handlePushChatNotification,
  isPushChatNotification,
} from "./push_chat_notification.ts";

export async function queueHandler(msg: unknown) {
  if (isDeleteChat(msg)) {
    await handleDeleteChat(msg);
  } else if (isPushChatNotification(msg)) {
    await handlePushChatNotification(msg);
  } else if (isDeleteS3Objects(msg)) {
    await handleDeleteS3Objects(msg);
  } else {
    console.error("Unknown KV Queue msg received", msg);
  }
}
