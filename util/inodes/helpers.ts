import { encodeBase64 } from "@std/encoding/base64";
import { signCloudfrontUrl, type SignCloudfrontUrlOptions } from "../aws.ts";
import { INODES_CLOUDFRONT_URL } from "../consts.ts";
import { getInodeById, setInode } from "../kv/inodes.ts";
import type { FileNode, Inode, VideoNode } from "../types.ts";
import { ROOT_DIR_ID } from "./consts.ts";

export function isPostProcessableUpload(inode: Inode) {
  return isVideoNode(inode);
}

export function isFileNodeWithManyS3Objects(inode: Inode) {
  return isVideoNode(inode);
}

export function isVideoNode(inode: Inode): inode is VideoNode {
  return (inode as FileNode).fileType.startsWith("video");
}

export function getInodeLabel(inode: Inode) {
  if (inode.type === "file") return "File";
  if (inode.parentDirId === ROOT_DIR_ID) return "Space";
  return "Folder";
}

export async function updateInodeWithRetry<T extends Inode>(
  entry: Deno.KvEntryMaybe<Inode>,
  data: T,
) {
  if (!entry.value) return;
  let commit = { ok: false };
  let i = 0;
  while (!commit.ok) {
    if (i > 0) entry = await getInodeById(entry.value.id);
    if (!entry.value) return;
    const atomic = setInode(data);
    atomic.check(entry);
    commit = await atomic.commit();
    i++;
  }
}

export function getFileNodeUrl(
  s3Key: string,
  opt: SignCloudfrontUrlOptions = {},
) {
  const url = `${INODES_CLOUDFRONT_URL}/${s3Key}`;
  return signCloudfrontUrl(url, opt);
}

export function makeVideoNodePlaylistDataUrl(
  playlist: string,
  origin: string,
) {
  const NEW_LINE = "\n";
  const result = playlist.split(NEW_LINE)
    .map((line) =>
      line.endsWith(".m3u8") ? `${origin}/inodes/video-playlist/${line}` : line
    )
    .join(NEW_LINE);
  return `data:application/vnd.apple.mpegurl;base64,${encodeBase64(result)}`;
}
