import { patchPostProcessedNode } from "../../inodes/post_process/post_process.ts";
import { isPostProcessedFileNode } from "../../inodes/post_process/type_predicates.ts";
import type { Exif, PostProcessedToImage } from "../../inodes/types.ts";
import { getInodeById } from "../../kv/inodes.ts";

export interface QueueMsgSharpProcessorEvent {
  type: "sharp-processor-event";
  time: string;
  detail: {
    status: "COMPLETE" | "ERROR";
    inodeId: string;
    inodeS3Key: string;
    previewFileName?: string;
    thumbFileName?: string;
    width?: number;
    height?: number;
    exif?: Exif;
  };
}

export function isSharpProcessorEvent(
  msg: unknown,
): msg is QueueMsgSharpProcessorEvent {
  const { type, time, detail } = msg as Partial<
    QueueMsgSharpProcessorEvent
  >;
  return typeof msg === "object" &&
    type === "sharp-processor-event" &&
    typeof time === "string" &&
    typeof detail === "object" &&
    typeof detail.inodeId === "string" &&
    typeof detail.inodeS3Key === "string" &&
    (detail.status === "COMPLETE" ||
      detail.status === "ERROR") &&
    (typeof detail.previewFileName === "string" ||
      typeof detail.previewFileName === "undefined") &&
    (typeof detail.thumbFileName === "undefined" ||
      typeof detail.thumbFileName === "string") &&
    (typeof detail.width === "undefined" ||
      typeof detail.width === "number") &&
    (typeof detail.height === "undefined" ||
      typeof detail.height === "number") &&
    (typeof detail.exif === "undefined" ||
      typeof detail.exif === "object");
}

export async function handleSharpProcessorEvent(
  msg: QueueMsgSharpProcessorEvent,
) {
  const {
    inodeId,
    inodeS3Key,
    status,
    width,
    height,
    exif,
    previewFileName,
    thumbFileName,
  } = msg.detail;

  const stateChangeDate = new Date(msg.time);
  const inodeEntry = await getInodeById(inodeId);
  const inode = inodeEntry.value;
  let postProcess;

  if (isPostProcessedFileNode(inode)) {
    postProcess = <PostProcessedToImage["postProcess"]> {
      ...inode.postProcess,
      status,
      stateChangeDate,
    };

    if (previewFileName) postProcess.previewFileName = previewFileName;
    if (thumbFileName) postProcess.thumbFileName = thumbFileName;
    if (width) postProcess.width = width;
    if (height) postProcess.height = height;
    if (exif) postProcess.exif = exif;

    if (exif?.DateTimeOriginal) {
      exif.DateTimeOriginal = new Date(exif.DateTimeOriginal);
    }
  }

  const inodePatch = {
    postProcess,
  };

  return patchPostProcessedNode({
    inodePatch,
    inodeEntry,
    inodeId,
    inodeS3Key,
    stateChangeDate,
  });
}
