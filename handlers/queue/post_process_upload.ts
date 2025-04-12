import { mediaconvert } from "$aws";
import { getSigner } from "../../util/aws.ts";
import { AWS_REGION, LOCAL_DEV_PUBLIC_URL } from "../../util/consts.ts";
import { isPostProcessableInode } from "../../util/inodes/helpers.ts";
import { setAnyInode } from "../../util/inodes/kv_wrappers.ts";
import { VideoNode } from "../../util/inodes/types.ts";
import { getInodeById } from "../../util/kv/inodes.ts";
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
  let inodeEntry = await getInodeById(inodeId);
  let inode = inodeEntry.value;

  if (!isPostProcessableInode(inode)) {
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

  const inodePatch = {
    mediaConvert: inode.mediaConvert,
    hasS3Folder: true,
  } satisfies Partial<VideoNode>;

  try {
    inodePatch.mediaConvert.jobId = await mediaconvert.createJob({
      job: createJobOptions(jobOptionsInput),
      signer: getSigner(),
      region: AWS_REGION,
    });
  } catch (err) {
    inodePatch.mediaConvert.status = "ERROR";
    console.error(err);
  }

  let commit = { ok: false };
  let commitIndex = 0;

  while (!commit.ok) {
    if (commitIndex) {
      inodeEntry = await getInodeById(inode.id);
      inode = inodeEntry.value;
      if (!isPostProcessableInode(inode)) return;
    }
    const atomic = setAnyInode({ ...inode, ...inodePatch });
    atomic.check(inodeEntry);
    commit = await atomic.commit();
    commitIndex++;
  }
}
