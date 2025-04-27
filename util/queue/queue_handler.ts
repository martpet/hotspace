import {
  handleChangeDirChildrenAcl,
  isChangeDirChildrenAcl,
} from "./change_dir_children_acl.ts";
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
  handlePostProcessFileNodes,
  isPostProcessFileNodes,
} from "./post_process/post_process_file_nodes.ts";
import {
  handlePostProcessVideoNode,
  isPostProcessVideoNode,
} from "./post_process/post_process_video_node.ts";
import {
  handleGeneralMediaProcessorEvent,
  isGeneralMediaProcessorEvent,
} from "./post_processor_event/general_media_processor_event.ts";
import {
  handleImageProcessorEvent,
  isImageProcessorEvent,
} from "./post_processor_event/image_processor_event.ts";
import {
  handleVideoProcessorEvent,
  isVideoProcessorEvent,
} from "./post_processor_event/video_processor_event.ts";
import {
  handlePushChatNotification,
  isPushChatNotification,
} from "./push_chat_notification.ts";

export function queueHandler(msg: unknown) {
  if (isPushChatNotification(msg)) return handlePushChatNotification(msg);
  if (isDeleteS3Objects(msg)) return handleDeleteS3Objects(msg);
  if (isDeleteDirChildren(msg)) return handleDeleteDirChildren(msg);
  if (isChangeDirChildrenAcl(msg)) return handleChangeDirChildrenAcl(msg);
  if (isCleanUpInode(msg)) return handleCleanUpInode(msg);
  if (isCleanUpUser(msg)) return handleCleanUpUser(msg);
  if (isPostProcessVideoNode(msg)) return handlePostProcessVideoNode(msg);
  if (isPostProcessFileNodes(msg)) return handlePostProcessFileNodes(msg);
  if (isVideoProcessorEvent(msg)) return handleVideoProcessorEvent(msg);
  if (isImageProcessorEvent(msg)) return handleImageProcessorEvent(msg);
  if (isGeneralMediaProcessorEvent(msg)) {
    return handleGeneralMediaProcessorEvent(msg);
  }

  console.error("Unhandled KV Queue message", msg);
}
