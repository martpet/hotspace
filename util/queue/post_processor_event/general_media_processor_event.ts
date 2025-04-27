import { patchPostProcessedNode } from "../../inodes/post_process/post_process.ts";
import type { PostProcessedFileNode } from "../../inodes/types.ts";
import { getInodeById } from "../../kv/inodes.ts";

export interface QueueMsgGeneralMediaProcessorEvent {
  type: "general-media-processor-event";
  time: "string";
  detail: {
    status: "COMPLETE" | "ERROR";
    inodeId: string;
    inodeS3Key: string;
  };
}

export function isGeneralMediaProcessorEvent(
  msg: unknown,
): msg is QueueMsgGeneralMediaProcessorEvent {
  const { type, time, detail } = msg as Partial<
    QueueMsgGeneralMediaProcessorEvent
  >;
  return typeof msg === "object" &&
    type === "general-media-processor-event" &&
    typeof time === "string" &&
    typeof detail === "object" &&
    typeof detail.inodeS3Key === "string" &&
    typeof detail.inodeId === "string" && (
      detail.status === "COMPLETE" ||
      detail.status === "ERROR"
    );
}

export async function handleGeneralMediaProcessorEvent(
  msg: QueueMsgGeneralMediaProcessorEvent,
) {
  const { inodeId, inodeS3Key, status } = msg.detail;
  const stateChangeDate = new Date(msg.time);
  const inodeEntry = await getInodeById(inodeId);
  const inode = inodeEntry.value;

  const inodePatch: Partial<PostProcessedFileNode> = {
    postProcess: {
      ...(inode as PostProcessedFileNode | null)?.postProcess,
      status,
      stateChangeDate,
    },
  };

  return patchPostProcessedNode({
    inodePatch,
    inodeEntry,
    inodeId,
    inodeS3Key,
    status,
    stateChangeDate,
  });
}
