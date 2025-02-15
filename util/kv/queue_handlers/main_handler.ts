import { handleDeleteChat, isDeleteChat } from "./delete_chat.ts";
import {
  handleDeleteDirChildren,
  isDeleteDirChildren,
} from "./delete_dir_children.ts";
import {
  handleDeleteS3Objects,
  isDeleteS3Objects,
} from "./delete_s3_objects.ts";
import {
  handlePushChatNotification,
  isPushChatNotification,
} from "./push_chat_notification.ts";

export function queueHandler(msg: unknown) {
  if (isPushChatNotification(msg)) return handlePushChatNotification(msg);
  if (isDeleteS3Objects(msg)) return handleDeleteS3Objects(msg);
  if (isDeleteDirChildren(msg)) return handleDeleteDirChildren(msg);
  if (isDeleteChat(msg)) return handleDeleteChat(msg);
  console.error("Unknown KV Queue msg received", msg);
}
