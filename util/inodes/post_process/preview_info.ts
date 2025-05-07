import { signFileNodeUrl } from "../helpers.ts";
import { MIME_CONFS } from "../mime.ts";
import type { FileNode } from "../types.ts";

export interface InodePreviewInfo {
  url: string;
  mimeType: string;
}

export async function getPreviewInfo(
  inode: FileNode,
): Promise<InodePreviewInfo | undefined> {
  const mimeConfig = MIME_CONFS[inode.mimeType];
  if (
    showOriginalImageAsPreview(inode) ||
    mimeConfig?.forceOrig ||
    !inode.postProcess?.previewMimeType
  ) {
    return {
      url: await signFileNodeUrl(inode.s3Key),
      mimeType: inode.mimeType,
    };
  }

  if (inode.postProcess.previewFileName) {
    const s3Key = `${inode.s3Key}/${inode.postProcess.previewFileName}`;
    return {
      url: await signFileNodeUrl(s3Key),
      mimeType: inode.postProcess.previewMimeType,
    };
  }
}

export function showOriginalImageAsPreview(inode: FileNode) {
  const mimeConfig = MIME_CONFS[inode.mimeType];
  return mimeConfig?.display === "image" && (inode.fileSize / 1024) < 200;
}
