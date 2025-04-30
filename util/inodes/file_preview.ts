import {
  isPostProcessedNode,
  isPostProcessedNodeToImage,
  signFileNodeUrl,
} from "./helpers.ts";
import { EXTRA_MIME_PREVIEWABLE_AS_TEXT } from "./mime.ts";
import type {
  FileNode,
  PostProcessedFileNode,
  PostProcessedNodeToImage,
} from "./types.ts";

export function isPreviewableInIframe(inode: FileNode) {
  return isPreviewableAsText(inode) ||
    isPreviewableAsHtml(inode) ||
    isPreviewableAsPdf(inode);
}

export function isPreviewableAsText({ fileType }: FileNode) {
  return fileType.startsWith("text/") ||
    EXTRA_MIME_PREVIEWABLE_AS_TEXT.includes(fileType);
}

export function isPreviewableAsPdf(inode: FileNode) {
  return inode.fileType.endsWith("/pdf") ||
    (isPostProcessedNode(inode) &&
      inode.postProcess.previewType === "pdf");
}

export function isPreviewableAsHtml(inode: FileNode) {
  return inode.fileType === "text/html" ||
    (isPostProcessedNode(inode) &&
      inode.postProcess.previewType === "html");
}

export function isNativelyPreviewableImage(inode: FileNode) {
  const { fileType } = inode;
  return fileType.startsWith("image/") && fileType !== "image/wmf";
}

export function isPreviewableAsImage(
  inode: FileNode,
): inode is PostProcessedNodeToImage {
  const { fileType } = inode;
  return isPostProcessedNodeToImage(inode) ||
    fileType === "image/svg+xml" ||
    isNativelyPreviewableImage(inode);
}

export function showOriginalImageAsPreview(inode: FileNode) {
  return isNativelyPreviewableImage(inode) && (inode.fileSize / 1024) < 200;
}

export function getPreviewUrl(inode: FileNode | PostProcessedFileNode) {
  const isPostProcessed = isPostProcessedNode(inode);
  let s3Key;
  if (
    !isPostProcessed && (
        isPreviewableAsPdf(inode) ||
        isPreviewableAsText(inode)
      ) || showOriginalImageAsPreview(inode)
  ) {
    s3Key = inode.s3Key;
  } else if (
    isPostProcessed &&
    inode.postProcess.previewType &&
    inode.postProcess.status === "COMPLETE"
  ) {
    const { previewType } = inode.postProcess;
    const fileExt = {
      image: "jpeg",
      html: "html",
      pdf: "pdf",
      text: "txt",
    };
    s3Key = `${inode.s3Key}/preview.${fileExt[previewType]}`;
  }

  if (s3Key) return signFileNodeUrl(s3Key);
}
