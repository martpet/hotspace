import { mediaconvert } from "$aws";
import { getSigner } from "../../aws.ts";
import { AWS_REGION } from "../../consts.ts";
import {
  createJobOptions,
  JobOptionsInput,
} from "../../inodes/aws_mediaconvert/job_options.ts";
import { setAnyInode } from "../../inodes/kv_wrappers.ts";
import { isPostProcessedToVideo } from "../../inodes/post_process/type_predicates.ts";
import { PostProcessedToVideo } from "../../inodes/types.ts";
import { getInodeById } from "../../kv/inodes.ts";

export interface QueueMsgPostProcessVideoNodes {
  type: "post-process-video-node";
  inodeId: string;
  appUrl: string;
}

export function isPostProcessVideoNode(
  msg: unknown,
): msg is QueueMsgPostProcessVideoNodes {
  const { type, inodeId, appUrl } = msg as Partial<
    QueueMsgPostProcessVideoNodes
  >;
  return typeof msg === "object" &&
    type === "post-process-video-node" &&
    typeof inodeId === "string" &&
    typeof appUrl === "string";
}

export async function handlePostProcessVideoNode(
  msg: QueueMsgPostProcessVideoNodes,
) {
  const { inodeId, appUrl } = msg;
  let inodeEntry = await getInodeById(inodeId);
  let inode = inodeEntry.value;

  if (!isPostProcessedToVideo(inode)) {
    return;
  }

  const jobOptionsInput: JobOptionsInput = {
    s3Key: inode.s3Key,
    userMetadata: {
      inodeId: inode.id,
      inodeS3Key: inode.s3Key,
      appUrl,
    },
  };

  const inodePatch = {
    postProcess: inode.postProcess,
  } satisfies Partial<PostProcessedToVideo>;

  let jobId;

  try {
    jobId = await mediaconvert.createJob({
      job: createJobOptions(jobOptionsInput),
      signer: getSigner(),
      region: AWS_REGION,
    });
    inodePatch.postProcess.jobId = jobId;
  } catch (err) {
    inodePatch.postProcess.status = "ERROR";
    console.error(err);
  }

  let commit = { ok: false };
  let commitIndex = 0;

  while (!commit.ok) {
    if (commitIndex) {
      inodeEntry = await getInodeById(inode.id);
      inode = inodeEntry.value;
      if (!isPostProcessedToVideo(inode)) {
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
