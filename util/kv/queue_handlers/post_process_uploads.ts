import { mediaconvert } from "$aws";
import { newQueue } from "@henrygd/queue";
import { getSigner } from "../../aws.ts";
import { AWS_REGION } from "../../consts.ts";
import { patchInode } from "../../inodes/util.ts";
import type { Inode, VideoNode } from "../../types.ts";
import { keys as getKvKey } from "../inodes.ts";
import { getManyEntries } from "../kv.ts";
import { getVideoJob } from "../mediaconvert_jobs.ts";

export interface QueueMsgPostProcessUploads {
  type: "post-process-uploads";
  ids: string[];
}

export function isPostProcessUploads(
  msg: unknown,
): msg is QueueMsgPostProcessUploads {
  const { type, ids } = msg as Partial<QueueMsgPostProcessUploads>;
  return typeof msg === "object" &&
    type === "post-process-uploads" &&
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
  const { ids } = msg;
  const kvKeys = ids.map((id) => getKvKey.byId(id));
  const entries = await getManyEntries<Inode>(kvKeys);
  const queue = newQueue(5);

  for (const entry of entries) {
    if (isVideoEntry(entry)) {
      queue.add(() => convertVideo(entry));
    }
  }

  return queue.done();
}

async function convertVideo(entry: Deno.KvEntry<VideoNode>) {
  const result = await mediaconvert.createJob({
    job: getVideoJob(entry.value.s3Key),
    signer: getSigner(),
    region: AWS_REGION,
  });

  const inodePatch: Partial<VideoNode> = {
    streamType: "hsl",
    mediaconvert: {
      status: "pending",
    },
  };

  if (result.error) {
    inodePatch.mediaconvert.status = "error";
    console.error(result.error);
  } else {
    inodePatch.mediaconvert.jobId = result.jobId;
  }

  return patchInode(entry, inodePatch);
}
