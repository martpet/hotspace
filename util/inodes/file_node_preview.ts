import { MiB } from "$util";
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
  const hasProcessedPreview = proc && previewMimeType;
  const isSmallFile = inode.fileSize <= MiB * 2;
  const isImage = display === "image";

  if (isPostProcessedToVideo(inode)) {
    return {
      display: "video",
      isOrig: false,
    };
  }

  if (
    display &&
    (forceOrig || isSmallFile && (isImage || !hasProcessedPreview))
  ) {
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
