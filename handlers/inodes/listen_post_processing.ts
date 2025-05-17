import { getPreviewInfo } from "../../util/inodes/inode_preview_info.ts";
import { createPostProcessingStatusHandler } from "../../util/inodes/post_process/create_status_handler.ts";
import { isPostProcessedToVideo } from "../../util/inodes/post_process/type_predicates.ts";

export default createPostProcessingStatusHandler(async (inode) => {
  const result: Record<string, unknown> = {
    status: inode.postProcess.status,
  };

  if (isPostProcessedToVideo(inode)) {
    result.percentComplete = inode.postProcess.percentComplete;
    result.videoUrl = inode.postProcess.playlistDataUrl;
  } else {
    result.previewUrl = (await getPreviewInfo(inode))?.url;
    result.mimeType = inode.postProcess.previewMimeType;
  }

  return result;
});
