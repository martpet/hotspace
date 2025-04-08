import { addCost } from "../../util/admin/app_costs.ts";
import { isVideoNode } from "../../util/inodes/helpers.ts";
import { setAnyInode } from "../../util/inodes/kv_wrappers.ts";
import {
  fetchMasterPlaylist,
  processMasterPlaylist,
} from "../../util/inodes/video_node_playlist.ts";
import { getAppSettings } from "../../util/kv/app_settings.ts";
import { getInodeById } from "../../util/kv/inodes.ts";
import { estimateJobCost } from "../../util/mediaconvert/job_cost.ts";
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
  const jobPercentComplete = jobProgress?.jobPercentComplete;

  const outputsDetails = outputGroupDetails?.[0].outputDetails.map((item) => ({
    durationInMs: item.durationInMs,
    widthInPx: item.videoDetails.widthInPx,
  }));

  let inodeEntry = await getInodeById(inodeId);
  let inode = inodeEntry.value;

  if (!inode || !isVideoNode(inode)) {
    return;
  }

  if (
    status === "STATUS_UPDATE" &&
    jobPercentComplete === inode.mediaConvert.percentComplete
  ) {
    return;
  }

  const { mediaConvert } = inode;

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
      mediaConvert.durationInMs = outputsDetails?.[0].durationInMs;
      if (outputsDetails) {
        const settingsEntry = await getAppSettings("eventual");
        const settings = settingsEntry.value;
        const pricing = settings?.mediaConvertPricing;
        if (pricing) {
          const cost = estimateJobCost({ pricing, outputsDetails });
          await addCost({ cost, settingsEntry });
        }
      }
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
      const hasNewerTimestamp = inode.mediaConvert.stateChangeTimestamp ||
        0 > timestamp;
      if (hasNewerTimestamp) return;
    }
    inode.mediaConvert = mediaConvert;
    const atomic = setAnyInode(inode);
    atomic.check(inodeEntry);
    commit = await atomic.commit();
    commitIndex++;
  }
}
