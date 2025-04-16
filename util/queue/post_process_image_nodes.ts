import { sqs } from "$aws";
import { newQueue } from "@henrygd/queue";
import { getSigner } from "../../util/aws.ts";
import { AWS_REGION, IMAGE_PROCESSOR_SQS_URL } from "../../util/consts.ts";
import { isImageNode } from "../../util/inodes/helpers.ts";
import { setAnyInode } from "../../util/inodes/kv_wrappers.ts";
import type { FileNode, ImageNode, Inode } from "../../util/inodes/types.ts";
import { getInodeById, keys as getInodeKey } from "../../util/kv/inodes.ts";
import { getManyEntries } from "../../util/kv/kv.ts";
import { getDevAppUrl } from "../../util/url.ts";

type PartialInode = Pick<FileNode, "id" | "s3Key" | "name">;

export interface QueueMsgPostProcessImageNodes {
  type: "post-process-image-nodes";
  items: PartialInode[];
  origin: string;
}

export function isPostProcessImageNodes(
  msg: unknown,
): msg is QueueMsgPostProcessImageNodes {
  const { type, items, origin } = msg as Partial<
    QueueMsgPostProcessImageNodes
  >;
  return typeof msg === "object" &&
    type === "post-process-image-nodes" &&
    typeof origin === "string" &&
    Array.isArray(items) &&
    items.every((item) =>
      typeof item.id === "string" && typeof item.s3Key === "string" &&
      typeof item.name === "string"
    );
}

export async function handlePostProcessImageNodes(
  msg: QueueMsgPostProcessImageNodes,
) {
  const { items, origin } = msg;
  const devAppUrl = getDevAppUrl(origin);

  const sqsMessages = items.map((item) => ({
    id: item.id,
    body: JSON.stringify({
      inodeId: item.id,
      inodeS3Key: item.s3Key,
      fileName: item.name,
      devAppUrl,
    }),
  }));

  const failedIds = await sqs.sendMessageBatch({
    messages: sqsMessages,
    sqsUrl: IMAGE_PROCESSOR_SQS_URL,
    region: AWS_REGION,
    signer: getSigner(),
  });

  if (failedIds.length) {
    await handleFailedMsgs(failedIds);
  }
}

async function handleFailedMsgs(ids: string[]) {
  const kvKeys = ids.map((id) => getInodeKey.byId(id));
  const entries = await getManyEntries<Inode>(kvKeys);
  const queue = newQueue(5);

  for (let entry of entries) {
    queue.add(async () => {
      if (!isImageNode(entry.value)) {
        return;
      }
      let commit = { ok: false };
      let commitIndex = 0;
      while (!commit.ok) {
        if (commitIndex) {
          entry = await getInodeById(entry.value.id);
        }
        if (!isImageNode(entry.value)) {
          return;
        }
        const atomic = setAnyInode<ImageNode>({
          ...entry.value,
          postProcess: {
            ...entry.value.postProcess,
            status: "ERROR",
          },
        });
        atomic.check(entry);
        commit = await atomic.commit();
        commitIndex++;
      }
    });
  }
  return queue.done();
}
