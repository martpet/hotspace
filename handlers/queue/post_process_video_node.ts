import { mediaconvert } from "$aws";
import { getSigner } from "../../util/aws.ts";
import { AWS_REGION } from "../../util/consts.ts";
import { isVideoNode } from "../../util/inodes/helpers.ts";
import { setAnyInode } from "../../util/inodes/kv_wrappers.ts";
import type { Inode, VideoNode } from "../../util/inodes/types.ts";
import { getInodeById } from "../../util/kv/inodes.ts";
import {
  createJobOptions,
  JobOptionsInput,
} from "../../util/mediaconvert/job_options.ts";
import { getDevAppUrl } from "../../util/url.ts";

export interface QueueMsgPostProcessVideoNode {
  type: "post-process-video-node";
  inodeId: string;
  inodeS3Key: string;
  origin: string;
}

export function isPostProcessVideoNode(
  msg: unknown,
): msg is QueueMsgPostProcessVideoNode {
  const { type, inodeId, origin, inodeS3Key } = msg as Partial<
    QueueMsgPostProcessVideoNode
  >;
  return typeof msg === "object" &&
    type === "post-process-video-node" &&
    typeof inodeId === "string" &&
    typeof inodeS3Key === "string" &&
    typeof origin === "string";
}

export async function handlePostProcessVideoNode(
  msg: QueueMsgPostProcessVideoNode,
) {
  const { inodeId, inodeS3Key, origin } = msg;
  let inodeEntry = await getInodeById(inodeId);
  let inode = inodeEntry.value;

  if (!isValidInode(inode, inodeS3Key)) {
    return;
  }

  const jobOptionsInput: JobOptionsInput = {
    s3Key: inode.s3Key,
    userMetadata: {
      inodeId: inode.id,
      inodeS3Key: inode.s3Key,
      devAppUrl: getDevAppUrl(origin),
      origin,
    },
  };

  const inodePatch = {
    mediaConvert: inode.mediaConvert,
  } satisfies Partial<VideoNode>;

  let jobId;

  try {
    jobId = await mediaconvert.createJob({
      job: createJobOptions(jobOptionsInput),
      signer: getSigner(),
      region: AWS_REGION,
    });
    inodePatch.mediaConvert.jobId = jobId;
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
      if (!isValidInode(inode, inodeS3Key)) {
        if (jobId) {
          await mediaconvert.cancelJob({
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

function isValidInode(
  inode: Inode | null,
  inodeS3Key: string,
): inode is VideoNode {
  return isVideoNode(inode) && inode.s3Key === inodeS3Key;
}
