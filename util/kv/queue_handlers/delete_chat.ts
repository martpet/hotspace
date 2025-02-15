import {
  deleteChatFeedItem,
  deleteChatMessage,
  deleteChatSub,
  listChatMessages,
  listChatSubs,
  listFeedItemsByChat,
} from "$chat";
import { newQueue } from "@henrygd/queue";
import { kv } from "../kv.ts";

export interface QueueMsgDeleteChat {
  type: "delete-chat";
  chatId: string;
}

export function isDeleteChat(msg: unknown): msg is QueueMsgDeleteChat {
  const { type, chatId } = msg as Partial<QueueMsgDeleteChat>;
  return typeof msg === "object" &&
    type === "delete-chat" &&
    typeof chatId === "string";
}

export async function handleDeleteChat({ chatId }: QueueMsgDeleteChat) {
  const { messages } = await listChatMessages({ kv, chatId });
  const feeds = await listFeedItemsByChat({ kv, chatId });
  const subs = await listChatSubs({ kv, chatId });

  const queue = newQueue(5);

  for (const msg of messages) {
    queue.add(() => deleteChatMessage(msg, kv.atomic()).commit());
  }

  for (const item of feeds) {
    queue.add(() => deleteChatFeedItem(item, kv));
  }

  for (const sub of subs) {
    queue.add(() => deleteChatSub(sub, kv.atomic()).commit());
  }

  return queue.done();
}
