import { mediaconvert } from "$aws";
import { newQueue } from "@henrygd/queue";
import { getSigner } from "../../aws.ts";
import {
  AWS_REGION,
  IS_LOCAL_DEV,
  isProd,
  LOCAL_DEV_PUBLIC_URL,
} from "../../consts.ts";
import {
  getVideoJob,
  type JobOptions,
} from "../../inodes/media_convert_job.ts";
import { updateInodeWithRetry } from "../../inodes/util.ts";
import type { Inode, VideoNode } from "../../types.ts";
import { keys as getKvKey } from "../inodes.ts";
import { getManyEntries } from "../kv.ts";

export interface QueueMsgPostProcessUploads {
  type: "post-process-uploads";
  ids: string[];
  origin: string;
}

export function isPostProcessUploads(
  msg: unknown,
): msg is QueueMsgPostProcessUploads {
  const { type, ids, origin } = msg as Partial<QueueMsgPostProcessUploads>;
  return typeof msg === "object" &&
    type === "post-process-uploads" &&
    typeof origin === "string" &&
    Array.isArray(ids) &&
    ids.every((id) => typeof id === "string");
}

function isVideoEntry(
  entry: Deno.KvEntryMaybe<Inode>,
): entry is Deno.KvEntry<VideoNode> {
  return entry.value !== null &&
    (entry.value as VideoNode).fileType.startsWith("video");
}

export async function handlePostProcessUploads(
  msg: QueueMsgPostProcessUploads,
) {
  const { ids, origin } = msg;
  const kvKeys = ids.map((id) => getKvKey.byId(id));
  const entries = await getManyEntries<Inode>(kvKeys);
  const queue = newQueue(5);

  for (const entry of entries) {
    if (isVideoEntry(entry)) {
      queue.add(() => convertVideo(entry, origin));
    }
  }

  return queue.done();
}

async function convertVideo(entry: Deno.KvEntry<VideoNode>, origin: string) {
  const videoNode = entry.value;

  const jobOptions: JobOptions = {
    s3Key: entry.value.s3Key,
    metaData: {
      inodeId: videoNode.id,
    },
  };

  if (!isProd) {
    const appUrl = IS_LOCAL_DEV ? LOCAL_DEV_PUBLIC_URL : origin;
    jobOptions.metaData.devNotificationEndpoint =
      `${appUrl}/webhooks/aws-media-convert`;
  }

  const result = await mediaconvert.createJob({
    job: getVideoJob(jobOptions),
    signer: getSigner(),
    region: AWS_REGION,
  });

  videoNode.convertData = {
    streamType: "hsl",
    status: "PENDING",
  };

  if (result.error) {
    videoNode.convertData.status = "ERROR";
    console.error(result.error);
  } else {
    videoNode.convertData.jobId = result.jobId;
  }

  return updateInodeWithRetry(entry, videoNode);
}
