import { sqs } from "$aws";
import { newQueue } from "@henrygd/queue";
import { getSigner } from "../../aws.ts";
import {
  AWS_REGION,
  IMAGE_PROCESSOR_SQS_URL,
  LIBRE_PROCESSOR_SQS_URL,
} from "../../consts.ts";
import { isPostProcessedFileNode } from "../../inodes/helpers.ts";
import { setAnyInode } from "../../inodes/kv_wrappers.ts";
import type {
  FileNode,
  Inode,
  PostProcessedFileNode,
  PostProcessor,
} from "../../inodes/types.ts";
import { getInodeById, keys as getInodeKey } from "../../kv/inodes.ts";
import { getManyEntries } from "../../kv/kv.ts";
import { getDevAppUrl } from "../../url.ts";

export interface QueueMsgPostProcessFileNodes {
  type: "post-process-file-nodes";
  processor: PostProcessor;
  items: Pick<FileNode, "id" | "s3Key" | "name">[];
  origin: string;
}

export function isPostProcessFileNodes(
  msg: unknown,
): msg is QueueMsgPostProcessFileNodes {
  const { type, processor, items, origin } = msg as Partial<
    QueueMsgPostProcessFileNodes
  >;
  return typeof msg === "object" &&
    type === "post-process-file-nodes" &&
    (processor === "image" || processor === "libre") &&
    typeof origin === "string" &&
    Array.isArray(items) &&
    items.every((item) =>
      typeof item.id === "string" && typeof item.s3Key === "string" &&
      typeof item.name === "string"
    );
}

export async function handlePostProcessFileNodes(
  msg: QueueMsgPostProcessFileNodes,
) {
  const { processor, items, origin } = msg;
  const devAppUrl = getDevAppUrl(origin);

  const sqsUrlByProcessor: Record<PostProcessor, string> = {
    image: IMAGE_PROCESSOR_SQS_URL,
    libre: LIBRE_PROCESSOR_SQS_URL,
  };

  const sqsUrl = sqsUrlByProcessor[processor];

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
    sqsUrl,
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
      if (!isPostProcessedFileNode(entry.value)) {
        return;
      }
      let commit = { ok: false };
      let commitIndex = 0;
      while (!commit.ok) {
        if (commitIndex) {
          entry = await getInodeById(entry.value.id);
        }
        if (!isPostProcessedFileNode(entry.value)) {
          return;
        }
        const atomic = setAnyInode<PostProcessedFileNode>({
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
