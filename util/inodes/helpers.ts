import { signCloudfrontUrl, type SignCloudfrontUrlOptions } from "../aws.ts";
import { INODES_CLOUDFRONT_URL } from "../consts.ts";
import type { Inode, InodeLabel, VideoNode } from "../inodes/types.ts";
import { ROOT_DIR_ID } from "./consts.ts";

export function isVideoNode(inode: Inode | null): inode is VideoNode {
  return inode !== null && inode.type === "file" &&
    inode.fileType.startsWith("video");
}

export function getInodeLabel(inode: Inode): InodeLabel {
  if (inode.type === "file") return "File";
  if (inode.parentDirId === ROOT_DIR_ID) return "Space";
  return "Folder";
}

export function getFileNodeUrl(
  s3Key: string,
  opt: SignCloudfrontUrlOptions = {},
) {
  const url = `${INODES_CLOUDFRONT_URL}/${s3Key}`;
  return signCloudfrontUrl(url, opt);
}
