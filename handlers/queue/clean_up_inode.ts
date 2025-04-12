import { mediaconvert } from "$aws";
import {
  deleteChatFeedItem,
  deleteChatMessage,
  deleteChatSub,
  deleteLastFeedItemIdByChat,
  listChatMessages,
  listChatSubs,
  listFeedItemsByChat,
} from "$chat";
import { newQueue } from "@henrygd/queue";
import { getSigner } from "../../util/aws.ts";
import { AWS_REGION } from "../../util/consts.ts";
import { kv } from "../../util/kv/kv.ts";

export interface QueueMsgCleanUpInode {
  type: "clean-up-inode";
  inodeId: string;
  pendingMediaConvertJob?: string;
}

export function isCleanUpInode(msg: unknown): msg is QueueMsgCleanUpInode {
  const { type, inodeId, pendingMediaConvertJob } = msg as Partial<
    QueueMsgCleanUpInode
  >;
  return typeof msg === "object" &&
    type === "clean-up-inode" &&
    typeof inodeId === "string" &&
    (typeof pendingMediaConvertJob === "string" ||
      typeof pendingMediaConvertJob === "undefined");
}

export async function handleCleanUpInode(msg: QueueMsgCleanUpInode) {
  const { inodeId, pendingMediaConvertJob } = msg;

  const promises = [
    cleanUpChat(inodeId),
  ];

  if (pendingMediaConvertJob) {
    promises.push(
      mediaconvert.cancelJob({
        jobId: pendingMediaConvertJob,
        signer: getSigner(),
        region: AWS_REGION,
      }).catch((err) => console.error(err)),
    );
  }

  await Promise.all(promises);
}

async function cleanUpChat(chatId: string) {
  const chatSubs = await listChatSubs({ kv, chatId });
  const chatFeeds = await listFeedItemsByChat({ kv, chatId });
  const { messages } = await listChatMessages({ kv, chatId });
  const queue = newQueue(5);

  queue.add(() => deleteLastFeedItemIdByChat(chatId, kv));

  for (const sub of chatSubs) {
    queue.add(() => deleteChatSub(sub, kv.atomic()).commit());
  }

  for (const feed of chatFeeds) {
    queue.add(() => deleteChatFeedItem(feed, kv));
  }

  for (const msg of messages) {
    queue.add(() => deleteChatMessage(msg, kv.atomic()).commit());
  }

  return queue.done();
}
