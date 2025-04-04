import type { VideoNode } from "../../util/inodes/types.ts";
import { processMasterPlaylist } from "../../util/inodes/video_node_playlist.ts";
import { getInodeById } from "../../util/kv/inodes.ts";
import { saveWithRetry } from "../../util/kv/kv.ts";
import { MediaConvertJobChangeStateDetail } from "../../util/mediaconvert/types.ts";

export type QueueMsgMediaConvertJobState = {
  type: "mediaconvert-job-state";
  detail: MediaConvertJobChangeStateDetail;
};

export function isMediaConvertJobState(
  msg: unknown,
): msg is QueueMsgMediaConvertJobState {
  const { type } = msg as Partial<QueueMsgMediaConvertJobState>;
  return typeof msg === "object" &&
    type === "mediaconvert-job-state";
}

export async function hanleMediaConvertJobState(
  msg: QueueMsgMediaConvertJobState,
) {
  const { userMetadata, status, jobProgress, outputGroupDetails } = msg.detail;
  const { inodeId, origin } = userMetadata;
  const durationInMs = outputGroupDetails?.[0].outputDetails[0].durationInMs;
  const jobPercentComplete = jobProgress?.jobPercentComplete;
  const inodeEntry = await getInodeById<VideoNode>(inodeId);
  const inode = inodeEntry.value;

  if (!inode) {
    return;
  }

  inode.mediaConvert.duratonInMs = durationInMs;

  if (jobPercentComplete !== undefined) {
    inode.mediaConvert.jobPercentComplete = jobPercentComplete;
  }

  if (status === "COMPLETE" || status === "ERROR") {
    inode.mediaConvert.status = status;
  }

  if (status === "COMPLETE") {
    try {
      const playlist = await processMasterPlaylist({ inode, origin });
      inode.mediaConvert.playlistDataUrl = playlist.dataUrl;
      inode.mediaConvert.subPlaylistsS3Keys = playlist.subPlaylistsS3Keys;
    } catch (err) {
      console.error(err);
      inode.mediaConvert.status = "ERROR";
    }
  }

  await saveWithRetry(inodeEntry);
}
