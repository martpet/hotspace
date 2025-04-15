import { signCloudfrontUrl, type SignCloudfrontUrlOptions } from "../aws.ts";
import { INODES_CLOUDFRONT_URL } from "../consts.ts";
import type {
  ImageNode,
  Inode,
  InodeLabel,
  VideoNode,
} from "../inodes/types.ts";
import { ROOT_DIR_ID } from "./consts.ts";

export function isVideoNode(inode: Inode | null): inode is VideoNode {
  return inode !== null && inode.type === "file" &&
    inode.fileType.startsWith("video/");
}

export function isImageNode(inode: Inode | null): inode is ImageNode {
  return inode !== null && inode.type === "file" &&
    inode.fileType.startsWith("image/");
}

export function isFileNodeWithS3Prefixes(inode: Inode) {
  return isVideoNode(inode) || isImageNode(inode);
}

export function showOriginalImageAsPreview(inode: ImageNode) {
  const fileSizeKb = inode.fileSize / 1024;
  return fileSizeKb < 200;
}

export function getImageNodeThumbKey(inode: ImageNode, size: "md" | "sm") {
  return `${inode.s3Key}/thumb_${size}.jpeg`;
}

export function getPreviewImageKey(inode: ImageNode) {
  return showOriginalImageAsPreview(inode)
    ? inode.s3Key
    : getImageNodeThumbKey(inode, "md");
}

export function getInodeLabel(inode: Inode): InodeLabel {
  if (inode.type === "file") return "File";
  if (inode.parentDirId === ROOT_DIR_ID) return "Space";
  return "Folder";
}

export function getSignedFileUrl(
  s3Key: string,
  opt: SignCloudfrontUrlOptions = {},
) {
  const url = `${INODES_CLOUDFRONT_URL}/${s3Key}`;
  return signCloudfrontUrl(url, opt);
}
