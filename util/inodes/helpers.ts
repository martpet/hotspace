import { signCloudfrontUrl, type SignCloudfrontUrlOptions } from "../aws.ts";
import { INODES_CLOUDFRONT_URL } from "../consts.ts";
import type {
  FileNode,
  Inode,
  InodeDisplay,
  InodeLabel,
} from "../inodes/types.ts";
import { ROOT_DIR_ID } from "./consts.ts";
import { MIME_CONFS } from "./mime.ts";
import { isPostProcessedToVideo } from "./post_process/type_predicates.ts";

export function getFileNodeDisplayType(inode: FileNode): InodeDisplay | null {
  if (isPostProcessedToVideo(inode)) return "video";
  const mime = inode.postProcess?.previewMimeType || inode.mimeType;
  return MIME_CONFS[mime]?.display || null;
}

export function isFileNodeWithMultipleS3Keys(inode: Inode) {
  return inode.type === "file" && !!MIME_CONFS[inode.mimeType]?.proc;
}

export function getInodeLabel(inode: Inode): InodeLabel {
  if (inode.type === "file") return "File";
  if (inode.parentDirId === ROOT_DIR_ID) return "Space";
  return "Folder";
}

export function signFileNodeUrl(
  s3Key: string,
  {
    isDownload,
    ...opt
  }: SignCloudfrontUrlOptions & {
    isDownload?: boolean;
  } = {},
) {
  let url: string | URL = `${INODES_CLOUDFRONT_URL}/${s3Key}`;
  if (isDownload) {
    url = new URL(url);
    url.searchParams.set("download", "1");
  }
  return signCloudfrontUrl(url, opt);
}
