import { signCloudfrontUrl, type SignCloudfrontUrlOptions } from "../aws.ts";
import { INODES_CLOUDFRONT_URL } from "../consts.ts";
import type { Inode, InodeLabel } from "../inodes/types.ts";
import { ROOT_DIR_ID } from "./consts.ts";
import { MIME_CONFS } from "./mime.ts";

export function isFileNodeWithMultipleS3Keys(inode: Inode) {
  return inode.type === "file" && !!MIME_CONFS[inode.mimeType]?.proc;
}

export function getInodeLabel(inode: Inode): InodeLabel {
  if (inode.type === "file") return "File";
  if (inode.parentDirId === ROOT_DIR_ID) return "Space";
  return "Folder";
}

export function getFileNodeUrl(
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
