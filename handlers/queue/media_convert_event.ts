import { isVideoNode } from "../../util/inodes/helpers.ts";
import { setAnyInode } from "../../util/inodes/kv_wrappers.ts";
import {
  fetchMasterPlaylist,
  processMasterPlaylist,
} from "../../util/inodes/video_node_playlist.ts";
import { getInodeById } from "../../util/kv/inodes.ts";
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
  const {
    userMetadata,
    status,
    jobProgress,
    outputGroupDetails,
    timestamp,
  } = msg.detail;

  const { inodeId, origin } = userMetadata;
  const durationInMs = outputGroupDetails?.[0].outputDetails[0].durationInMs;
  const jobPercentComplete = jobProgress?.jobPercentComplete;

  let inodeEntry = await getInodeById(inodeId);
  let inode = inodeEntry.value;

  if (!inode || !isVideoNode(inode)) {
    return;
  }

  const { mediaConvert } = inode;

  if (durationInMs !== undefined) {
    mediaConvert.durationInMs = durationInMs;
  }

  if (jobPercentComplete !== undefined) {
    mediaConvert.percentComplete = jobPercentComplete;
  }

  if (timestamp) {
    mediaConvert.stateChangeTimestamp = timestamp;
  }

  if (status !== "STATUS_UPDATE") {
    mediaConvert.status = status;
  }

  if (status === "COMPLETE") {
    try {
      const playlist = processMasterPlaylist({
        masterPlaylist: await fetchMasterPlaylist(inode),
        inodeId: inode.id,
        origin,
      });
      mediaConvert.streamType = "hls";
      mediaConvert.playlistDataUrl = playlist.dataUrl;
      mediaConvert.subPlaylistsS3Keys = playlist.subPlaylistsS3Keys;
    } catch (err) {
      console.error(err);
      mediaConvert.status = "ERROR";
    }
  }

  let commit = { ok: false };
  let commitIndex = 0;

  while (!commit.ok) {
    if (commitIndex) {
      inodeEntry = await getInodeById(inode.id);
      inode = inodeEntry.value;
      if (!inode || !isVideoNode(inode)) return;
      const newNewerTimestamp = inode.mediaConvert.stateChangeTimestamp ||
        0 > timestamp;
      if (newNewerTimestamp) return;
    }
    inode.mediaConvert = mediaConvert;
    const atomic = setAnyInode(inode);
    atomic.check(inodeEntry);
    commit = await atomic.commit();
    commitIndex++;
  }
}
