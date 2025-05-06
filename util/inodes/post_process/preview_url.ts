import { signFileNodeUrl } from "../helpers.ts";
import { MIME_CONFS } from "../mime.ts";
import type { FileNode } from "../types.ts";

export function getPreviewUrl(inode: FileNode) {
  const mimeConfig = MIME_CONFS[inode.mimeType];
  if (
    showOriginalImageAsPreview(inode) ||
    mimeConfig?.forceOrig ||
    !inode.postProcess?.previewMimeType
  ) {
    return signFileNodeUrl(inode.s3Key);
  }

  if (inode.postProcess.previewFileName) {
    return signFileNodeUrl(
      `${inode.s3Key}/${inode.postProcess.previewFileName}`,
    );
  }
}

export function showOriginalImageAsPreview(inode: FileNode) {
  const mimeConfig = MIME_CONFS[inode.mimeType];
  return mimeConfig?.display === "image" && (inode.fileSize / 1024) < 200;
}
