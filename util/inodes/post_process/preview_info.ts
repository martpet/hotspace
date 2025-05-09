import { getFileNodeUrl } from "../helpers.ts";
import { MIME_CONFS } from "../mime.ts";
import type { FileNode, InodeDisplay } from "../types.ts";
import { isPostProcessedToVideo } from "./type_predicates.ts";

export interface InodePreviewInfo {
  displayType: InodeDisplay | null;
  isOriginalFile: boolean | null;
  mimeType: string | null;
  url: string | null;
}

export async function getPreviewInfo(inode: FileNode) {
  const result: InodePreviewInfo = {
    displayType: getFileNodeDisplayType(inode),
    isOriginalFile: null,
    mimeType: null,
    url: null,
  };

  const mimeConf = MIME_CONFS[inode.mimeType];

  if (
    showOriginalImageAsPreview(inode) ||
    mimeConf?.forceOrig ||
    !inode.postProcess?.previewMimeType
  ) {
    result.isOriginalFile = true;
    result.mimeType = inode.mimeType;
    result.url = await getFileNodeUrl(inode.s3Key);
  } else if (inode.postProcess.previewFileName) {
    const s3Key = `${inode.s3Key}/${inode.postProcess.previewFileName}`;
    result.isOriginalFile = false;
    result.mimeType = inode.postProcess.previewMimeType;
    result.url = await getFileNodeUrl(s3Key);
  }

  return result;
}

export function getFileNodeDisplayType(inode: FileNode): InodeDisplay | null {
  if (isPostProcessedToVideo(inode)) return "video";
  const mime = inode.postProcess?.previewMimeType || inode.mimeType;
  return MIME_CONFS[mime]?.display || null;
}

function showOriginalImageAsPreview(inode: FileNode) {
  const mimeConf = MIME_CONFS[inode.mimeType];
  return mimeConf?.display === "image" && (inode.fileSize / 1024) < 200;
}
