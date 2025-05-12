import { mediaconvert } from "$aws";
import { addCost } from "../../admin/app_costs.ts";
import { getSigner } from "../../aws.ts";
import { AWS_REGION } from "../../consts.ts";
import { estimateJobCost } from "../../inodes/aws_mediaconvert/job_cost.ts";
import type { MediaConvertJobChangeStateDetail } from "../../inodes/aws_mediaconvert/types.ts";
import { setAnyInode } from "../../inodes/kv_wrappers.ts";
import {
  cleanupS3Objects,
  isStaleEvent,
} from "../../inodes/post_process/post_process.ts";
import { isPostProcessedToVideo } from "../../inodes/post_process/type_predicates.ts";
import type {
  PostProcessedToVideo,
  PostProcessStatus,
} from "../../inodes/types.ts";
import {
  fetchMasterPlaylist,
  processMasterPlaylist,
} from "../../inodes/video_node_playlist.ts";
import { getAppSettings } from "../../kv/app_settings.ts";
import { getInodeById } from "../../kv/inodes.ts";
import { kv } from "../../kv/kv.ts";

export type QueueMsgVideoProcessorEvent = {
  type: "video-processor-event";
  detail: MediaConvertJobChangeStateDetail;
};

export function isVideoProcessorEvent(
  msg: unknown,
): msg is QueueMsgVideoProcessorEvent {
  const { type } = msg as Partial<QueueMsgVideoProcessorEvent>;
  return typeof msg === "object" &&
    type === "video-processor-event";
}

export async function handleVideoProcessorEvent(
  msg: QueueMsgVideoProcessorEvent,
) {
  const {
    userMetadata,
    status,
    jobProgress,
    jobId,
    outputGroupDetails,
  } = msg.detail;

  const { inodeId, inodeS3Key, origin } = userMetadata;
  const stateChangeDate = new Date(msg.detail.timestamp);
  const jobPercentComplete = jobProgress?.jobPercentComplete;
  let inodeEntry = await getInodeById(inodeId);
  let inode = inodeEntry.value;

  const outputs = outputGroupDetails?.[0].outputDetails.map((item) => ({
    durationInMs: item.durationInMs,
    widthInPx: item.videoDetails.widthInPx,
    heightInPx: item.videoDetails.heightInPx,
  }));

  if (isStaleEvent(inode, stateChangeDate)) {
    return;
  }

  if (!isPostProcessedToVideo(inode)) {
    await cleanup({ inodeS3Key, status, jobId });
    return;
  }

  if (
    status === "STATUS_UPDATE" &&
    jobPercentComplete === inode.postProcess.percentComplete
  ) {
    return;
  }

  const inodePatch = {
    postProcess: inode.postProcess,
  } satisfies Partial<PostProcessedToVideo>;

  inodePatch.postProcess.stateChangeDate = stateChangeDate;

  if (jobPercentComplete !== undefined) {
    inodePatch.postProcess.percentComplete = jobPercentComplete;
  }

  if (status !== "STATUS_UPDATE") {
    inodePatch.postProcess.status = status;
  }

  const atomic = kv.atomic();

  if (status === "COMPLETE") {
    try {
      const playlist = processMasterPlaylist({
        masterPlaylist: await fetchMasterPlaylist(inode),
        inodeId: inode.id,
        origin,
      });
      inodePatch.postProcess.streamType = "hls";
      inodePatch.postProcess.playlistDataUrl = playlist.dataUrl;
      inodePatch.postProcess.subPlaylistsS3Keys = playlist.subPlaylistsS3Keys;
      inodePatch.postProcess.durationInMs = outputs?.[0].durationInMs;
      inodePatch.postProcess.width = outputs?.[0].widthInPx;
      inodePatch.postProcess.height = outputs?.[0].heightInPx;
      if (outputs) {
        const settingsEntry = await getAppSettings("eventual");
        const settings = settingsEntry.value;
        const pricing = settings?.mediaConvertPricing;
        if (pricing) {
          const cost = estimateJobCost({ pricing, outputs });
          await addCost({ cost, settingsEntry, atomic });
        }
      }
    } catch (err) {
      console.error(err);
      inodePatch.postProcess.status = "ERROR";
    }
  }

  let commit = { ok: false };
  let commitIndex = 0;

  while (!commit.ok) {
    if (commitIndex) {
      inodeEntry = await getInodeById(inode.id);
      inode = inodeEntry.value;
      if (isStaleEvent(inode, stateChangeDate)) {
        return;
      }
      if (!isPostProcessedToVideo(inode)) {
        await cleanup({ inodeS3Key, status, jobId });
        return;
      }
    }
    setAnyInode({ ...inode, ...inodePatch }, atomic);
    atomic.check(inodeEntry);
    commit = await atomic.commit();
    commitIndex++;
  }
}

function cleanup(input: {
  inodeS3Key: string;
  jobId: string;
  status:
    | MediaConvertJobChangeStateDetail["status"]
    | PostProcessStatus;
}) {
  const { status, inodeS3Key, jobId } = input;
  const promises: Promise<unknown>[] = [
    cleanupS3Objects(inodeS3Key),
  ];
  if (status === "PENDING") {
    promises.push(mediaconvert.cancelJob({
      jobId,
      signer: getSigner(),
      region: AWS_REGION,
    }));
  }
  return Promise.all(promises);
}
