import { getImagePreviewUrl } from "../../../util/inodes/file_preview.ts";
import { isImageNode } from "../../../util/inodes/helpers.ts";
import { createFileNodeProcessingStatusHandler } from "../../../util/inodes/post_process/create_status_handler.ts";

export default createFileNodeProcessingStatusHandler(async (inode) => {
  if (!isImageNode(inode)) return null;

  return {
    status: inode.postProcess.status,
    imageUrl: await getImagePreviewUrl(inode),
  };
});
