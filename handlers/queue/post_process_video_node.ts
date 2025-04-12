import { mediaconvert } from "$aws";
import { getSigner } from "../../util/aws.ts";
import { AWS_REGION } from "../../util/consts.ts";
import { isVideoNode } from "../../util/inodes/helpers.ts";
import { setAnyInode } from "../../util/inodes/kv_wrappers.ts";
import { VideoNode } from "../../util/inodes/types.ts";
import { getInodeById } from "../../util/kv/inodes.ts";
import {
  createJobOptions,
  JobOptionsInput,
} from "../../util/mediaconvert/job_options.ts";
import { getDevAppUrl } from "../../util/url.ts";

export interface QueueMsgPostProcessVideoNode {
  type: "post-process-video-node";
  inodeId: string;
  origin: string;
}

export function isPostProcessVideoNode(
  msg: unknown,
): msg is QueueMsgPostProcessVideoNode {
  const { type, inodeId, origin } = msg as Partial<
    QueueMsgPostProcessVideoNode
  >;
  return typeof msg === "object" &&
    type === "post-process-video-node" &&
    typeof inodeId === "string" &&
    typeof origin === "string";
}

export async function handlePostProcessVideoNode(
  msg: QueueMsgPostProcessVideoNode,
) {
  const { inodeId, origin } = msg;
  let inodeEntry = await getInodeById(inodeId);
  let inode = inodeEntry.value;

  if (!isVideoNode(inode)) {
    return;
  }

  const jobOptionsInput: JobOptionsInput = {
    s3Key: inode.s3Key,
    userMetadata: {
      inodeId: inode.id,
      origin,
      devAppUrl: getDevAppUrl(origin),
    },
  };

  const inodePatch = {
    hasS3Folder: true,
    mediaConvert: inode.mediaConvert,
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
      if (!isVideoNode(inode)) {
        const { jobId } = inodePatch.mediaConvert;
        if (jobId) {
          mediaconvert.cancelJob({
            jobId,
            signer: getSigner(),
            region: AWS_REGION,
          });
        }
        return;
      }
    }
    const atomic = setAnyInode({ ...inode, ...inodePatch });
    atomic.check(inodeEntry);
    commit = await atomic.commit();
    commitIndex++;
  }
}
