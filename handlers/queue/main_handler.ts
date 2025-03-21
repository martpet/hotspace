import { handleCleanUpInode, isCleanUpInode } from "./clean_up_inode.ts";
import { handleCleanUpUser, isCleanUpUser } from "./clean_up_user.ts";
import {
  handleDeleteDirChildren,
  isDeleteDirChildren,
} from "./delete_dir_children.ts";
import {
  handleDeleteS3Objects,
  isDeleteS3Objects,
} from "./delete_s3_objects.ts";
import {
  handleMediaConvertEvent,
  isMediaConvertEvent,
} from "./media_convert_event.ts";
import {
  handlePostProcessUpload,
  isPostProcessUpload,
} from "./post_process_upload.ts";
import {
  handlePushChatNotification,
  isPushChatNotification,
} from "./push_chat_notification.ts";

export function queueHandler(msg: unknown) {
  if (isPushChatNotification(msg)) return handlePushChatNotification(msg);
  if (isDeleteS3Objects(msg)) return handleDeleteS3Objects(msg);
  if (isDeleteDirChildren(msg)) return handleDeleteDirChildren(msg);
  if (isCleanUpInode(msg)) return handleCleanUpInode(msg);
  if (isCleanUpUser(msg)) return handleCleanUpUser(msg);
  if (isPostProcessUpload(msg)) return handlePostProcessUpload(msg);
  if (isMediaConvertEvent(msg)) return handleMediaConvertEvent(msg);

  console.error("Unhandled KV Queue message", msg);
}
