import { mediaconvert } from "$aws";
import { getSigner } from "../../util/aws.ts";
import {
  AWS_REGION,
  IS_LOCAL_DEV,
  isProd,
  LOCAL_DEV_PUBLIC_URL,
} from "../../util/consts.ts";
import { isVideoNode, updateInodeWithRetry } from "../../util/inodes/util.ts";
import { getVideoJob, type JobOptions } from "../../util/inodes/video_job.ts";
import { getInodeById } from "../../util/kv/inodes.ts";

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

  const jobOptions: JobOptions = {
    s3Key: inode.s3Key,
    metaData: { inodeId: inode.id },
  };

  if (!isProd) {
    const APP_URL = IS_LOCAL_DEV ? LOCAL_DEV_PUBLIC_URL : origin;
    jobOptions.metaData.notificationEndpoint =
      `${APP_URL}/webhooks/aws-media-convert`;
  }

  const { jobId } = await mediaconvert.createJob({
    job: getVideoJob(jobOptions),
    signer: getSigner(),
    region: AWS_REGION,
  });

  inode.mediaConvert = {
    streamType: "hsl",
    status: "PENDING",
    jobId,
  };

  return updateInodeWithRetry(entry, inode);
}
