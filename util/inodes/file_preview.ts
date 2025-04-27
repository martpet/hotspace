import { isPostProcessedFileNode, signFileNodeUrl } from "./helpers.ts";
import { MIME_PREVIEWABLE_AS_TEXT } from "./mime.ts";
import type {
  FileNode,
  ImageNode,
  ImagePreviewSize,
  PostProcessedFileNode,
} from "./types.ts";

export function isPreviewableAsText({ fileType }: FileNode) {
  return fileType.startsWith("text/") ||
    MIME_PREVIEWABLE_AS_TEXT.includes(fileType);
}

export function isPreviewableAsPdf(inode: FileNode) {
  return inode.fileType.endsWith("/pdf") ||
    (isPostProcessedFileNode(inode) &&
      inode.postProcess.previewType === "pdf");
}
export function showOriginalImageAsPreview(inode: ImageNode) {
  const fileSizeKb = inode.fileSize / 1024;
  return fileSizeKb < 200;
}

export function getImagePreviewUrl(
  inode: ImageNode,
  size: ImagePreviewSize = "md",
) {
  let s3Key;
  if (showOriginalImageAsPreview(inode)) {
    s3Key = inode.s3Key;
  } else if (inode.postProcess.status === "COMPLETE") {
    s3Key = `${inode.s3Key}/thumb_${size}.jpeg`;
  }
  if (s3Key) return signFileNodeUrl(s3Key);
}

export function getPdfPreviewUrl(inode: FileNode | PostProcessedFileNode) {
  let s3Key;
  if (inode.fileType.endsWith("/pdf")) {
    s3Key = inode.s3Key;
  } else if (
    isPostProcessedFileNode(inode) &&
    inode.postProcess.previewType === "pdf" &&
    inode.postProcess.status === "COMPLETE"
  ) {
    s3Key = `${inode.s3Key}/preview.pdf`;
  }
  if (s3Key) return signFileNodeUrl(s3Key);
}
