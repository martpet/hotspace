import { patchPostProcessedNode } from "../../inodes/post_process/post_process.ts";
import type { Exif, ImageNode } from "../../inodes/types.ts";
import { getInodeById } from "../../kv/inodes.ts";

export interface QueueMsgImageProcessorEvent {
  type: "image-processor-event";
  time: "string";
  detail: {
    status: "COMPLETE" | "ERROR";
    inodeId: string;
    inodeS3Key: string;
    width?: number;
    height?: number;
    exif?: Exif;
  };
}

export function isImageProcessorEvent(
  msg: unknown,
): msg is QueueMsgImageProcessorEvent {
  const { type, time, detail } = msg as Partial<
    QueueMsgImageProcessorEvent
  >;
  return typeof msg === "object" &&
    type === "image-processor-event" &&
    typeof time === "string" &&
    typeof detail === "object" &&
    typeof detail.inodeS3Key === "string" &&
    typeof detail.inodeId === "string" &&
    (
      typeof detail.width === "undefined" ||
      typeof detail.width === "number"
    ) &&
    (
      typeof detail.height === "undefined" ||
      typeof detail.height === "number"
    ) &&
    (
      typeof detail.exif === "undefined" ||
      typeof detail.exif === "object"
    ) &&
    (
      detail.status === "COMPLETE" ||
      detail.status === "ERROR"
    );
}

export async function handleImageProcessorEvent(
  msg: QueueMsgImageProcessorEvent,
) {
  const { inodeId, inodeS3Key, status, width, height, exif } = msg.detail;
  const stateChangeDate = new Date(msg.time);
  const inodeEntry = await getInodeById(inodeId);
  const inode = inodeEntry.value;

  if (exif?.DateTimeOriginal) {
    exif.DateTimeOriginal = new Date(exif.DateTimeOriginal);
  }

  const inodePatch: Partial<ImageNode> = {
    postProcess: {
      ...(inode as ImageNode | null)?.postProcess,
      stateChangeDate,
      status,
      width,
      height,
      exif,
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
