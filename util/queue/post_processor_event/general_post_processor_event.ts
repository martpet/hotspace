import { patchPostProcessedNode } from "../../inodes/post_process/post_process.ts";
import { isPostProcessedFileNode } from "../../inodes/post_process/type_predicates.ts";
import type { PostProcessedFileNode } from "../../inodes/types.ts";
import { getInodeById } from "../../kv/inodes.ts";

export interface QueueMsgGeneralPostProcessorEvent {
  type: "general-post-processor-event";
  time: string;
  detail: {
    status: "COMPLETE" | "ERROR";
    inodeId: string;
    inodeS3Key: string;
    previewFileName: "string";
  };
}

export function isGeneralPostProcessorEvent(
  msg: unknown,
): msg is QueueMsgGeneralPostProcessorEvent {
  const { type, time, detail } = msg as Partial<
    QueueMsgGeneralPostProcessorEvent
  >;
  return typeof msg === "object" &&
    type === "general-post-processor-event" &&
    typeof time === "string" &&
    typeof detail === "object" &&
    typeof detail.inodeId === "string" &&
    typeof detail.inodeS3Key === "string" &&
    (detail.status === "COMPLETE" ||
      detail.status === "ERROR") &&
    (typeof detail.previewFileName === "string" ||
      typeof detail.previewFileName === "undefined");
}

export async function handleGeneralPostProcessorEvent(
  msg: QueueMsgGeneralPostProcessorEvent,
) {
  const { inodeId, inodeS3Key, status, previewFileName } = msg.detail;
  const stateChangeDate = new Date(msg.time);
  const inodeEntry = await getInodeById(inodeId);
  const inode = inodeEntry.value;
  let inodePatch: Partial<PostProcessedFileNode> = {};

  if (isPostProcessedFileNode(inode)) {
    inodePatch = {
      postProcess: {
        ...inode.postProcess,
        status,
        stateChangeDate,
        previewFileName,
      },
    };
  }

  return patchPostProcessedNode({
    inodePatch,
    inodeEntry,
    inodeId,
    inodeS3Key,
    status,
    stateChangeDate,
  });
}
