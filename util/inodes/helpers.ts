import { encodeBase64 } from "@std/encoding";
import { signCloudfrontUrl, type SignCloudfrontUrlOptions } from "../aws.ts";
import { INODES_CLOUDFRONT_URL } from "../consts.ts";
import { getInodeById } from "../kv/inodes.ts";
import type { FileNode, Inode, InodeLabel, VideoNode } from "../types.ts";
import { ROOT_DIR_ID } from "./consts.ts";
import { setAnyInode } from "./kv_wrappers.ts";

export function isPostProcessableUpload(inode: Inode) {
  return isVideoNode(inode);
}

export function isFileNodeWithManyS3Objects(inode: Inode) {
  return isVideoNode(inode);
}

export function isVideoNode(inode: Inode): inode is VideoNode {
  return (inode as FileNode).fileType.startsWith("video");
}

export function getInodeLabel(inode: Inode): InodeLabel {
  if (inode.type === "file") return "File";
  if (inode.parentDirId === ROOT_DIR_ID) return "Space";
  return "Folder";
}

export async function updateInodeWithRetry(
  entry: Deno.KvEntryMaybe<Inode>,
  inode: Inode,
) {
  if (!entry.value) return;
  let commit = { ok: false };
  let i = 0;
  while (!commit.ok) {
    if (i > 0) entry = await getInodeById(entry.value.id);
    if (!entry.value) return;
    const atomic = setAnyInode(inode);
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

export function processVideоNodeMasterPlaylist(input: {
  playlist: string;
  inodeId: string;
  origin: string;
}) {
  const { playlist, inodeId, origin } = input;
  const lines = playlist.split("\n");
  const processedLines = [];
  const subPlaylistsS3Keys: string[] = [];
  let subPlaylistIndex = 0;
  for (const line of lines) {
    if (!line.endsWith(".m3u8")) {
      processedLines.push(line);
    } else {
      subPlaylistsS3Keys.push(line);
      processedLines.push(
        `${origin}/inodes/video-playlist/${inodeId}/${subPlaylistIndex}`,
      );
      subPlaylistIndex++;
    }
  }
  const playlistResult = processedLines.join("\n");
  const playListDataUrl = `data:application/vnd.apple.mpegurl;base64,${
    encodeBase64(playlistResult)
  }`;
  return {
    playListDataUrl,
    subPlaylistsS3Keys,
  };
}
