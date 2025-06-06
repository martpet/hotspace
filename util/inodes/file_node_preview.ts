import { getFileNodeUrl } from "./helpers.ts";
import { MIMES } from "./mime_conf.ts";
import { isPostProcessedToVideo } from "./post_process/type_predicates.ts";
import type { FileNode, FileNodeDisplay } from "./types.ts";

export type FileNodePreview = Partial<{
  url: string;
  display: FileNodeDisplay;
  mimeType: string;
  isOrig: boolean;
}>;

export async function getFileNodePreview(
  inode: FileNode,
): Promise<FileNodePreview> {
  const { display, forceOrig, proc } = MIMES[inode.mimeType] || {};
  const { previewMimeType, previewFileName } = inode.postProcess || {};
  const isSmallImage = display === "image" && (inode.fileSize / 1024) < 200;
  const hasProcessedPreview = proc && previewMimeType;

  if (isPostProcessedToVideo(inode)) {
    return {
      display: "video",
      isOrig: false,
    };
  }

  if ((forceOrig || isSmallImage || !hasProcessedPreview) && display) {
    return {
      isOrig: true,
      url: await getFileNodeUrl(inode.s3Key),
      mimeType: inode.mimeType,
      display,
    };
  }

  if (
    hasProcessedPreview &&
    MIMES[previewMimeType].display
  ) {
    let url;
    if (previewFileName) {
      url = await getFileNodeUrl(`${inode.s3Key}/${previewFileName}`);
    }
    return {
      url,
      display: MIMES[previewMimeType].display,
      mimeType: previewMimeType,
      isOrig: false,
    };
  }

  return {};
}
