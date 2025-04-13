import { mediaconvert } from "$aws";
import { addCost } from "../../util/admin/app_costs.ts";
import { getSigner } from "../../util/aws.ts";
import { AWS_REGION, INODES_BUCKET } from "../../util/consts.ts";
import { isVideoNode } from "../../util/inodes/helpers.ts";
import { setAnyInode } from "../../util/inodes/kv_wrappers.ts";
import type { Inode, VideoNode } from "../../util/inodes/types.ts";
import {
  fetchMasterPlaylist,
  processMasterPlaylist,
} from "../../util/inodes/video_node_playlist.ts";
import { getAppSettings } from "../../util/kv/app_settings.ts";
import { enqueue } from "../../util/kv/enqueue.ts";
import { getInodeById } from "../../util/kv/inodes.ts";
import { estimateJobCost } from "../../util/mediaconvert/job_cost.ts";
import { type MediaConvertJobChangeStateDetail } from "../../util/mediaconvert/types.ts";
import { type QueueMsgDeleteS3Objects } from "./delete_s3_objects.ts";

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
    jobId,
    outputGroupDetails,
    timestamp,
  } = msg.detail;

  const { inodeId, inodeS3Key, origin } = userMetadata;
  const jobPercentComplete = jobProgress?.jobPercentComplete;
  let inodeEntry = await getInodeById(inodeId);
  let inode = inodeEntry.value;

  const outputs = outputGroupDetails?.[0].outputDetails.map((item) => ({
    durationInMs: item.durationInMs,
    widthInPx: item.videoDetails.widthInPx,
    heightInPx: item.videoDetails.heightInPx,
  }));

  if (isStaleEvent(inode, timestamp)) {
    return;
  }

  if (!isValidInode(inode, inodeS3Key)) {
    await abortOrCleanup({ status, inodeS3Key, jobId });
    return;
  }

  if (
    status === "STATUS_UPDATE" &&
    jobPercentComplete === inode.mediaConvert.percentComplete
  ) {
    return;
  }

  const inodePatch = {
    mediaConvert: inode.mediaConvert,
  } as VideoNode;

  if (jobPercentComplete !== undefined) {
    inodePatch.mediaConvert.percentComplete = jobPercentComplete;
  }

  if (timestamp) {
    inodePatch.mediaConvert.stateChangeTimestamp = timestamp;
  }

  if (status !== "STATUS_UPDATE") {
    inodePatch.mediaConvert.status = status;
  }

  if (status === "COMPLETE") {
    try {
      const playlist = processMasterPlaylist({
        masterPlaylist: await fetchMasterPlaylist(inode),
        inodeId: inode.id,
        origin,
      });
      inodePatch.mediaConvert.streamType = "hls";
      inodePatch.mediaConvert.playlistDataUrl = playlist.dataUrl;
      inodePatch.mediaConvert.subPlaylistsS3Keys = playlist.subPlaylistsS3Keys;
      inodePatch.mediaConvert.durationInMs = outputs?.[0].durationInMs;
      inodePatch.mediaConvert.width = outputs?.[0].widthInPx;
      inodePatch.mediaConvert.height = outputs?.[0].heightInPx;
      if (outputs) {
        const settingsEntry = await getAppSettings("eventual");
        const settings = settingsEntry.value;
        const pricing = settings?.mediaConvertPricing;
        if (pricing) {
          const cost = estimateJobCost({ pricing, outputs });
          await addCost({ cost, settingsEntry });
        }
      }
    } catch (err) {
      console.error(err);
      inodePatch.mediaConvert.status = "ERROR";
    }
  }

  let commit = { ok: false };
  let commitIndex = 0;

  while (!commit.ok) {
    if (commitIndex) {
      inodeEntry = await getInodeById(inode.id);
      inode = inodeEntry.value;
      if (!isStaleEvent(inode, timestamp)) {
        return;
      }
      if (!isValidInode(inode, inodeS3Key)) {
        await abortOrCleanup({ status, inodeS3Key, jobId });
        return;
      }
    }
    const atomic = setAnyInode({ ...inode, ...inodePatch });
    atomic.check(inodeEntry);
    commit = await atomic.commit();
    commitIndex++;
  }
}

function isStaleEvent(inode: Inode | null, timestamp: number) {
  if (!isVideoNode(inode)) return;
  const prevTimestamp = inode.mediaConvert.stateChangeTimestamp || 0;
  return prevTimestamp > timestamp;
}

function isValidInode(
  inode: Inode | null,
  inodeS3Key: string,
): inode is VideoNode {
  return isVideoNode(inode) && inode.s3Key === inodeS3Key;
}

function abortOrCleanup(input: {
  status: string;
  inodeS3Key: string;
  jobId: string;
}) {
  const { status, inodeS3Key, jobId } = input;
  if (status === "COMPLETE") {
    return enqueue<QueueMsgDeleteS3Objects>({
      type: "delete-s3-objects",
      bucket: INODES_BUCKET,
      s3KeysData: [{
        name: inodeS3Key,
        isPrefix: true,
      }],
    }).commit();
  } else {
    return mediaconvert.cancelJob({
      jobId,
      signer: getSigner(),
      region: AWS_REGION,
    });
  }
}
