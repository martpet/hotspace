import { updateInodeWithRetry } from "../../util/inodes/util.ts";
import { getInodeById } from "../../util/kv/inodes.ts";
import { VideoNode } from "../../util/types.ts";

export interface QueueMsgAwsMediaConvertEvent {
  type: "aws-media-convert-event";
  inodeId: string;
  status: "COMPLETE" | "ERROR";
}

export function isAwsMediaConvertEvent(
  msg: unknown,
): msg is QueueMsgAwsMediaConvertEvent {
  const { type, inodeId, status } = msg as Partial<
    QueueMsgAwsMediaConvertEvent
  >;
  return typeof msg === "object" &&
    type === "aws-media-convert-event" &&
    typeof inodeId === "string" &&
    (status === "COMPLETE" || status === "ERROR");
}

export async function handleAwsMediaConvertEvent(
  msg: QueueMsgAwsMediaConvertEvent,
) {
  const { inodeId, status } = msg;
  const entry = await getInodeById<VideoNode>(inodeId);
  const inode = entry.value;

  if (inode) {
    inode.mediaConvert.status = status;
    await updateInodeWithRetry(entry, inode);
  }
}
