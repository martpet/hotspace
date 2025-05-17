import { format } from "@std/fmt/bytes";
import { STATUS_CODE } from "@std/http/status";
import { signCloudfrontUrl, type SignCloudfrontUrlOptions } from "../aws.ts";
import { INODES_CLOUDFRONT_URL } from "../consts.ts";
import type { Inode, InodeLabel } from "../inodes/types.ts";
import { getTotalUploadedBytesByUser } from "../kv/uploads_stats.ts";
import type { User } from "../types.ts";
import { ROOT_DIR_ID } from "./consts.ts";
import { MIME_CONFS } from "./mime.ts";

export function getInodeLabel(inode: Inode): InodeLabel {
  if (inode.type === "file") return "File";
  if (inode.parentDirId === ROOT_DIR_ID) return "Space";
  return "Folder";
}

export function isFileNodeWithMultipleS3Keys(inode: Inode) {
  return inode.type === "file" && !!MIME_CONFS[inode.mimeType]?.proc;
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

export async function checkCreditAfterUpload(input: {
  user: User;
  uploads: { fileSize: number }[];
}): Promise<
  { ok: true } | {
    ok: false;
    msg: string;
    status: number;
  }
> {
  const { user, uploads } = input;
  const uploadsSize = uploads.reduce((a, v) => a + v.fileSize, 0);
  const totalUploaded = await getTotalUploadedBytesByUser(user);
  const { limitBytes } = user.uploadCredit;
  const creditAfterUpload = limitBytes - (uploadsSize + totalUploaded);
  if (creditAfterUpload >= 0) {
    return { ok: true };
  } else {
    return {
      ok: false,
      msg: `Upload size exceeds quota by ${format(-creditAfterUpload)}`,
      status: STATUS_CODE.ContentTooLarge,
    };
  }
}
