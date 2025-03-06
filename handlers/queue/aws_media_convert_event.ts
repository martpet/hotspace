import { updateInodeWithRetry } from "../../util/inodes/util.ts";
import { getInodeById } from "../../util/kv/inodes.ts";
import { VideoNode } from "../../util/types.ts";

export type QueueMsgAwsMediaConvertEvent = {
  type: "aws-media-convert-event";
  inodeId: string;
  status: "COMPLETE" | "ERROR" | "STATUS_UPDATE";
  jobPercentComplete?: number;
};

export function isAwsMediaConvertEvent(
  msg: unknown,
): msg is QueueMsgAwsMediaConvertEvent {
  const { type, inodeId, jobPercentComplete, status } = msg as Partial<
    QueueMsgAwsMediaConvertEvent
  >;
  return typeof msg === "object" &&
    type === "aws-media-convert-event" &&
    typeof inodeId === "string" &&
    (status === "COMPLETE" || status === "ERROR" ||
      status === "STATUS_UPDATE") &&
    (typeof jobPercentComplete === "undefined" ||
      typeof jobPercentComplete === "number");
}

export async function handleAwsMediaConvertEvent(
  msg: QueueMsgAwsMediaConvertEvent,
) {
  const { inodeId, status, jobPercentComplete } = msg;
  const entry = await getInodeById<VideoNode>(inodeId);
  const inode = entry.value;

  if (!inode) {
    return;
  }

  if (status === "COMPLETE" || status === "ERROR") {
    inode.mediaConvert.status = status;
  }

  if (typeof jobPercentComplete !== "undefined") {
    inode.mediaConvert.jobPercentComplete = jobPercentComplete;
  }

  await updateInodeWithRetry(entry, inode);
}
