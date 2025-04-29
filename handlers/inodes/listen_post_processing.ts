import { getPreviewUrl } from "../../util/inodes/file_preview.ts";
import { isVideoNode } from "../../util/inodes/helpers.ts";
import { createFileNodeProcessingStatusHandler } from "../../util/inodes/post_process/create_status_handler.ts";

export default createFileNodeProcessingStatusHandler(async (inode) => {
  const result: Record<string, unknown> = {
    status: inode.postProcess.status,
  };

  if (isVideoNode(inode)) {
    result.percentComplete = inode.postProcess.percentComplete;
    result.playlistDataUrl = inode.postProcess.playlistDataUrl;
  } else {
    result.previewUrl = await getPreviewUrl(inode);
  }

  return result;
});
