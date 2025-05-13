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
import { ACL_ID_ALL } from "../../modules/util/file_permissions.ts";
import { getSigner } from "../../util/aws.ts";
import { AWS_REGION } from "../../util/consts.ts";
import { kv } from "../../util/kv/kv.ts";
import type { InodeBase } from "../inodes/types.ts";
import { deleteInAclOfNotOwnInode } from "../kv/acl.ts";

type PartialInode = Pick<InodeBase, "id" | "ownerId" | "acl">;

export interface QueueMsgCleanUpInode {
  type: "clean-up-inode";
  inode: PartialInode;
  pendingMediaConvertJob?: string;
}

export function isCleanUpInode(msg: unknown): msg is QueueMsgCleanUpInode {
  const {
    type,
    inode,
    pendingMediaConvertJob,
  } = msg as Partial<QueueMsgCleanUpInode>;

  return typeof msg === "object" &&
    type === "clean-up-inode" &&
    typeof inode === "object" &&
    typeof inode.id === "string" &&
    typeof inode.ownerId === "string" &&
    (typeof pendingMediaConvertJob === "string" ||
      typeof pendingMediaConvertJob === "undefined");
}

export async function handleCleanUpInode(msg: QueueMsgCleanUpInode) {
  const { inode, pendingMediaConvertJob } = msg;

  const promises = [
    (async () => {
      await cleanUpChat(inode.id);
      await cleanUpAclIndexes(inode);
    })(),
  ];

  if (pendingMediaConvertJob) {
    promises.push(mediaconvert.cancelJob({
      jobId: pendingMediaConvertJob,
      signer: getSigner(),
      region: AWS_REGION,
    }));
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

function cleanUpAclIndexes(inode: PartialInode) {
  const queue = newQueue(5);
  for (const userId of Object.keys(inode.acl)) {
    if (userId !== inode.ownerId && userId !== ACL_ID_ALL) {
      queue.add(() =>
        deleteInAclOfNotOwnInode({
          userId,
          inodeId: inode.id,
        }).commit()
      );
    }
  }
  return queue.done();
}
