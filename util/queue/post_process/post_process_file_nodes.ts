import { sqs } from "$aws";
import { newQueue } from "@henrygd/queue";
import { allExtensions } from "@std/media-types";
import { getSigner } from "../../aws.ts";
import {
  AWS_REGION,
  LIBRE_PROCESSOR_SQS_URL,
  PANDOC_PROCESSOR_SQS_URL,
  SHARP_PROCESSOR_SQS_URL,
} from "../../consts.ts";
import { setAnyInode } from "../../inodes/kv_wrappers.ts";
import { MIMES } from "../../inodes/mime_conf.ts";
import {
  isPostProcessedFileNode,
} from "../../inodes/post_process/type_predicates.ts";
import type { CustomPostProcessor } from "../../inodes/post_process/types.ts";
import type { FileNode, Inode } from "../../inodes/types.ts";
import { getInodeById, keys as getInodeKey } from "../../kv/inodes.ts";
import { getManyEntries } from "../../kv/kv.ts";

export interface QueueMsgPostProcessFileNodes {
  type: "post-process-file-nodes";
  proc: CustomPostProcessor;
  items: Pick<FileNode, "id" | "s3Key" | "name" | "mimeType">[];
  appUrl: string;
}

export function isPostProcessFileNodes(
  msg: unknown,
): msg is QueueMsgPostProcessFileNodes {
  const { type, proc, items, appUrl } = msg as Partial<
    QueueMsgPostProcessFileNodes
  >;
  return typeof msg === "object" &&
    type === "post-process-file-nodes" &&
    (proc === "sharp" ||
      proc === "libre" ||
      proc === "pandoc") &&
    typeof appUrl === "string" &&
    Array.isArray(items) &&
    items.every((item) =>
      typeof item.id === "string" &&
      typeof item.s3Key === "string" &&
      typeof item.mimeType === "string" &&
      typeof item.name === "string"
    );
}

const SQS_URL_BY_PROC: Record<CustomPostProcessor, string> = {
  sharp: SHARP_PROCESSOR_SQS_URL,
  libre: LIBRE_PROCESSOR_SQS_URL,
  pandoc: PANDOC_PROCESSOR_SQS_URL,
};

export async function handlePostProcessFileNodes(
  msg: QueueMsgPostProcessFileNodes,
) {
  const { proc, items, appUrl } = msg;

  const sqsUrl = SQS_URL_BY_PROC[proc];
  const messages = [];

  for (const item of items) {
    const body: Record<string, unknown> = {
      inodeId: item.id,
      inodeS3Key: item.s3Key,
      inputFileName: item.name,
      appUrl,
    };

    const mimeConf = MIMES[item.mimeType];

    if (!mimeConf?.proc) {
      continue;
    }

    if (mimeConf.proc === "pandoc") {
      const fileExt = (allExtensions(item.mimeType) || [])[0];
      if (!fileExt) continue;
      body.inputFileExt = fileExt;
    } else if (mimeConf.proc === "sharp") {
      body.thumbOnly = mimeConf.thumbOnly;
      body.fromMimeType = item.mimeType;
    }

    if (mimeConf.to) {
      body.toMimeType = mimeConf.to;
    }

    messages.push({
      id: item.id,
      body: JSON.stringify(body),
    });
  }

  const failedIds = await sqs.sendMessageBatch({
    messages,
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
        const atomic = setAnyInode({
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
