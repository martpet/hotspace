import {
  getFileNodeUrl,
  makeVideoNodePlaylistDataUrl,
  updateInodeWithRetry,
} from "../../util/inodes/helpers.ts";
import { getInodeById } from "../../util/kv/inodes.ts";
import type { VideoNode } from "../../util/types.ts";

export type QueueMsgMediaConvertEvent = {
  type: "media-convert-event";
  inodeId: string;
  status: "COMPLETE" | "ERROR" | "STATUS_UPDATE";
  jobPercentComplete?: number;
  origin: string;
};

export function isMediaConvertEvent(
  msg: unknown,
): msg is QueueMsgMediaConvertEvent {
  const {
    type,
    inodeId,
    jobPercentComplete,
    status,
    origin,
  } = msg as Partial<QueueMsgMediaConvertEvent>;
  return typeof msg === "object" &&
    type === "media-convert-event" &&
    typeof inodeId === "string" &&
    (status === "COMPLETE" || status === "ERROR" ||
      status === "STATUS_UPDATE") &&
    (typeof jobPercentComplete === "undefined" ||
      typeof jobPercentComplete === "number") &&
    typeof origin === "string";
}

export async function handleMediaConvertEvent(
  msg: QueueMsgMediaConvertEvent,
) {
  const { inodeId, status, jobPercentComplete, origin } = msg;
  const entry = await getInodeById<VideoNode>(inodeId);
  const inode = entry.value;

  if (!inode) {
    return;
  }

  if (typeof jobPercentComplete !== "undefined") {
    inode.mediaConvert.jobPercentComplete = jobPercentComplete;
  }

  if (status === "COMPLETE" || status === "ERROR") {
    inode.mediaConvert.status = status;
  }

  if (status === "COMPLETE") {
    try {
      const playlist = await fetchPlaylist(inode);
      const dataUrl = makeVideoNodePlaylistDataUrl(playlist, origin);
      inode.mediaConvert.playlistDataUrl = dataUrl;
    } catch (err) {
      console.error(err);
      inode.mediaConvert.status = "ERROR";
    }
  }

  await updateInodeWithRetry(entry, inode);
}

async function fetchPlaylist(inode: VideoNode) {
  const url = await getFileNodeUrl(inode.s3Key + ".m3u8");
  const resp = await fetch(url);
  if (!resp.ok) {
    const respText = await resp.text();
    throw new Error(
      `Cannot fetch playlist; Status: ${resp.status}; Text: "${respText}"`,
    );
  }
  return resp.text();
}
