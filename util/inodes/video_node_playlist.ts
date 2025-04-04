import { s3 } from "$aws";
import { encodeBase64 } from "@std/encoding";
import { getSigner } from "../aws.ts";
import { INODES_BUCKET } from "../consts.ts";
import type { VideoNode } from "./types.ts";

export async function processMasterPlaylist(input: {
  inode: VideoNode;
  origin: string;
}) {
  const { inode, origin } = input;
  const playlist = await fetchPlaylist(inode);
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
        `${origin}/inodes/video-playlist/${inode.id}/${subPlaylistIndex}`,
      );
      subPlaylistIndex++;
    }
  }
  const playlistResult = processedLines.join("\n");
  const dataUrl = `data:application/vnd.apple.mpegurl;base64,${
    encodeBase64(playlistResult)
  }`;
  return {
    dataUrl,
    subPlaylistsS3Keys,
  };
}

async function fetchPlaylist(inode: VideoNode) {
  const resp = await s3.getObject({
    s3Key: inode.s3Key + ".m3u8",
    signer: getSigner(),
    bucket: INODES_BUCKET,
    accelerated: true,
  });
  const respText = await resp.text();
  if (!resp.ok) {
    throw new Error(
      `Cannot fetch playlist; Status: ${resp.status}; Text: "${respText}"`,
    );
  }
  return respText;
}
