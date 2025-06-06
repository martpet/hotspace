import { getFileExtension } from "$util";
import { format } from "@std/fmt/bytes";
import { signCloudfrontUrl, type SignCloudfrontUrlOptions } from "../aws.ts";
import { INODES_CLOUDFRONT_URL } from "../consts.ts";
import { getRemainingUploadBytesByUser } from "../kv/upload_stats.ts";
import { ROOT_DIR_ID } from "./consts.ts";
import { MIMES } from "./mime_conf.ts";
import type { FileNode, Inode, InodeLabel } from "./types.ts";

export function getInodeLabel(inode: Inode): InodeLabel {
  if (inode.type === "file") return "File";
  if (inode.parentDirId === ROOT_DIR_ID) return "Space";
  return "Folder";
}

export function isFileNodeWithMultipleS3Keys(inode: Inode) {
  return inode.type === "file" && !!MIMES[inode.mimeType]?.proc;
}

export function getFileNodeKind(inode: FileNode) {
  const title = MIMES[inode.mimeType]?.title;
  if (typeof title === "string") return title;
  if (typeof title === "object") {
    const ext = getFileExtension(inode.name);
    if (title[ext]) return title[ext];
  }
  return inode.mimeType;
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

export async function checkUploadQuotaAfterUpload(opt: {
  userId: string;
  uploads: { fileSize: number }[];
}) {
  const { userId, uploads } = opt;
  const bytesToUpload = uploads.reduce((a, v) => a + v.fileSize, 0);
  const remainingBytesBefore = await getRemainingUploadBytesByUser(userId);
  const remainingBytesAfter = remainingBytesBefore - bytesToUpload;
  if (remainingBytesAfter >= 0) {
    return {
      ok: true,
    };
  }

  return {
    ok: false,
    error: {
      code: "quota_exceeded",
      message: `${
        uploads.length > 1 ? "Total file" : "File"
      } size exceeds your upload quota by ${format(-remainingBytesAfter)}.`,
    },
  };
}
