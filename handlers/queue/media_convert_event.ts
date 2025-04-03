import { s3 } from "$aws";
import { getSigner } from "../../util/aws.ts";
import { INODES_BUCKET } from "../../util/consts.ts";
import {
  processVideоNodeMasterPlaylist,
  updateInodeWithRetry,
} from "../../util/inodes/helpers.ts";
import type { VideoNode } from "../../util/inodes/types.ts";
import { getInodeById } from "../../util/kv/inodes.ts";

export type QueueMsgMediaConvertEvent = {
  type: "media-convert-event";
  inodeId: string;
  status: "COMPLETE" | "ERROR" | "STATUS_UPDATE";
  origin: string;
  jobPercentComplete?: number;
  duratonInMs?: number;
};

export function isMediaConvertEvent(
  msg: unknown,
): msg is QueueMsgMediaConvertEvent {
  const {
    type,
    inodeId,
    origin,
    jobPercentComplete,
    duratonInMs,
    status,
  } = msg as Partial<QueueMsgMediaConvertEvent>;
  return typeof msg === "object" &&
    type === "media-convert-event" &&
    typeof inodeId === "string" &&
    typeof origin === "string" &&
    (status === "COMPLETE" || status === "ERROR" ||
      status === "STATUS_UPDATE") &&
    (typeof jobPercentComplete === "undefined" ||
      typeof jobPercentComplete === "number") &&
    (typeof duratonInMs === "undefined" ||
      typeof duratonInMs === "number");
}

export async function handleMediaConvertEvent(
  msg: QueueMsgMediaConvertEvent,
) {
  const { inodeId, status, origin, jobPercentComplete, duratonInMs } = msg;
  const entry = await getInodeById<VideoNode>(inodeId);
  const inode = entry.value;

  if (!inode) {
    return;
  }

  inode.mediaConvert.duratonInMs = duratonInMs;

  if (typeof jobPercentComplete !== "undefined") {
    inode.mediaConvert.jobPercentComplete = jobPercentComplete;
  }

  if (status === "COMPLETE" || status === "ERROR") {
    inode.mediaConvert.status = status;
  }

  if (status === "COMPLETE") {
    try {
      const playlist = await fetchPlaylist(inode);
      const {
        playListDataUrl,
        subPlaylistsS3Keys,
      } = processVideоNodeMasterPlaylist({
        playlist,
        inodeId,
        origin,
      });
      inode.mediaConvert.playlistDataUrl = playListDataUrl;
      inode.mediaConvert.subPlaylistsS3Keys = subPlaylistsS3Keys;
    } catch (err) {
      console.error(err);
      inode.mediaConvert.status = "ERROR";
    }
  }

  await updateInodeWithRetry(entry, inode);
}

async function fetchPlaylist(inode: VideoNode) {
  const resp = await s3.getObject({
    s3Key: inode.s3Key + ".m3u8",
    signer: getSigner(),
    bucket: INODES_BUCKET,
    accelerated: true,
  });
  if (!resp.ok) {
    const respText = await resp.text();
    throw new Error(
      `Cannot fetch playlist; Status: ${resp.status}; Text: "${respText}"`,
    );
  }
  return resp.text();
}
