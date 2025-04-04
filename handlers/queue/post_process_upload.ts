import { mediaconvert } from "$aws";
import { getSigner } from "../../util/aws.ts";
import { AWS_REGION, LOCAL_DEV_PUBLIC_URL } from "../../util/consts.ts";
import { isVideoNode } from "../../util/inodes/helpers.ts";
import { getInodeById } from "../../util/kv/inodes.ts";
import { saveWithRetry } from "../../util/kv/kv.ts";
import {
  createJobOptions,
  JobOptionsInput,
} from "../../util/mediaconvert/job_options.ts";

export interface QueueMsgPostProcessUpload {
  type: "post-process-upload";
  inodeId: string;
  origin: string;
}

export function isPostProcessUpload(
  msg: unknown,
): msg is QueueMsgPostProcessUpload {
  const { type, inodeId, origin } = msg as Partial<QueueMsgPostProcessUpload>;
  return typeof msg === "object" &&
    type === "post-process-upload" &&
    typeof inodeId === "string" &&
    typeof origin === "string";
}

export async function handlePostProcessUpload(
  msg: QueueMsgPostProcessUpload,
) {
  const { inodeId, origin } = msg;
  const entry = await getInodeById(inodeId);
  const inode = entry.value;

  if (!inode || !isVideoNode(inode)) {
    return;
  }

  const jobOptionsInput: JobOptionsInput = {
    s3Key: inode.s3Key,
    userMetadata: {
      inodeId: inode.id,
      origin,
      devUrl: LOCAL_DEV_PUBLIC_URL || origin,
    },
  };

  try {
    inode.mediaConvert.jobId = await mediaconvert.createJob({
      job: createJobOptions(jobOptionsInput),
      signer: getSigner(),
      region: AWS_REGION,
    });
  } catch (err) {
    inode.mediaConvert.status = "ERROR";
    console.error(err);
  }

  return saveWithRetry(entry);
}
