import { getPdfPreviewUrl } from "../../../util/inodes/file_preview.ts";
import { isPostProcessedFileNode } from "../../../util/inodes/helpers.ts";
import { createFileNodeProcessingStatusHandler } from "../../../util/inodes/post_process/create_status_handler.ts";

export default createFileNodeProcessingStatusHandler(async (inode) => {
  if (
    !isPostProcessedFileNode(inode) ||
    inode.postProcess.previewType !== "pdf"
  ) return null;

  return {
    status: inode.postProcess.status,
    pdfUrl: await getPdfPreviewUrl(inode),
  };
});
