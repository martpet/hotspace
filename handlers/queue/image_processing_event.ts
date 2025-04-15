import { INODES_BUCKET } from "../../util/consts.ts";
import { isImageNode } from "../../util/inodes/helpers.ts";
import { setAnyInode } from "../../util/inodes/kv_wrappers.ts";
import type { Exif, ImageNode, Inode } from "../../util/inodes/types.ts";
import { enqueue } from "../../util/kv/enqueue.ts";
import { getInodeById } from "../../util/kv/inodes.ts";
import { type QueueMsgDeleteS3Objects } from "./delete_s3_objects.ts";

export interface QueueMessageImageProcessingState {
  type: "image-processing-state";
  isoTimestamp: "string";
  detail: {
    status: "COMPLETE" | "ERROR";
    inodeId: string;
    inodeS3Key: string;
    width?: number;
    height?: number;
    exif?: Exif;
  };
}

export function isImageProcessingState(
  msg: unknown,
): msg is QueueMessageImageProcessingState {
  const { type, isoTimestamp, detail } = msg as Partial<
    QueueMessageImageProcessingState
  >;
  return typeof msg === "object" && type === "image-processing-state" &&
    typeof isoTimestamp === "string" &&
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

export async function handleImageProcessingState(
  msg: QueueMessageImageProcessingState,
) {
  const { isoTimestamp } = msg;
  const { inodeId, inodeS3Key, status, width, height, exif } = msg.detail;
  let inodeEntry = await getInodeById(inodeId);
  let inode = inodeEntry.value;

  if (isStaleEvent(inode, isoTimestamp)) {
    return;
  }

  if (!isImageNode(inode)) {
    await cleanupMaybe({ inodeS3Key, status });
    return;
  }

  const inodePatch: Partial<ImageNode> = {
    postProcess: {
      stateChangeIsoTimestamp: isoTimestamp,
      status,
      width,
      height,
      exif,
    },
  };

  let commit = { ok: false };
  let commitIndex = 0;

  while (!commit.ok) {
    if (commitIndex) {
      inodeEntry = await getInodeById(inode.id);
      inode = inodeEntry.value;
      if (!isStaleEvent(inode, isoTimestamp)) {
        return;
      }
      if (!isImageNode(inode)) {
        await cleanupMaybe({ inodeS3Key, status });
        return;
      }
    }
    const atomic = setAnyInode({ ...inode, ...inodePatch });
    atomic.check(inodeEntry);
    commit = await atomic.commit();
    commitIndex++;
  }
}

function isStaleEvent(inode: Inode | null, currentTimestamp: string) {
  if (!isImageNode(inode)) return false;
  const prevTimestamp = inode.postProcess.stateChangeIsoTimestamp;
  if (!prevTimestamp) return false;
  return new Date(prevTimestamp) > new Date(currentTimestamp);
}

function cleanupMaybe(input: {
  inodeS3Key: string;
  status:
    | QueueMessageImageProcessingState["detail"]["status"]
    | ImageNode["postProcess"]["status"];
}) {
  const { inodeS3Key, status } = input;
  if (status === "PENDING") {
    return enqueue<QueueMsgDeleteS3Objects>({
      type: "delete-s3-objects",
      bucket: INODES_BUCKET,
      s3KeysData: [{
        name: inodeS3Key,
        isPrefix: true,
      }],
    }).commit();
  }
}
