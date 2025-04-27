import { signCloudfrontUrl, type SignCloudfrontUrlOptions } from "../aws.ts";
import { INODES_CLOUDFRONT_URL } from "../consts.ts";
import type {
  FileNode,
  ImageNode,
  Inode,
  InodeLabel,
  PostProcessedFileNode,
  VideoNode,
} from "../inodes/types.ts";
import { ROOT_DIR_ID } from "./consts.ts";
import { LIBRE_OFFICE_MIME_SUPPORT } from "./mime.ts";

function isFileNode(inode: Inode | null): inode is FileNode {
  return !!inode && inode.type === "file";
}

export function isVideoNode(inode: Inode | null): inode is VideoNode {
  return isFileNode(inode) && inode.fileType.startsWith("video/");
}

export function isImageNode(inode: Inode | null): inode is ImageNode {
  return isFileNode(inode) && inode.fileType.startsWith("image/") &&
    inode.fileType !== "image/x-wmf";
}

export function isLibreProcessable(
  inode: Inode,
): inode is PostProcessedFileNode {
  return isFileNode(inode) &&
    LIBRE_OFFICE_MIME_SUPPORT.includes(inode.fileType);
}

export function isPostProcessable(inode: Inode) {
  return isVideoNode(inode) || isImageNode(inode) || isLibreProcessable(inode);
}

export function isPostProcessedFileNode(
  inode: Inode | null,
): inode is PostProcessedFileNode {
  return isFileNode(inode) &&
    typeof (inode as PostProcessedFileNode).postProcess === "object";
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
