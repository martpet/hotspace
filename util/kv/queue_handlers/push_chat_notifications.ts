import {
  deleteChatSub,
  listChatSubs,
  type QueueMsgChatMsgPush,
  setChatSub,
} from "$chat";
import { associateBy, chunk } from "@std/collections";
import { CHAT_SUB_WITHOUT_PUSH_SUB_EXPIRES } from "../../chat.ts";
import type { Subscriber } from "../../types.ts";
import { sendPushNotification } from "../../webpush.ts";
import { deleteQueueNonce, getQueueNonce } from "../enqueue.ts";
import { kv } from "../kv.ts";
import { keys as subscribersKeys } from "../subscribers.ts";

export function isPushChatNotifications(
  msg: unknown,
): msg is QueueMsgChatMsgPush {
  const {
    type,
    chatId,
    chatMsgId,
    pageTitle,
    chatUrl,
  } = msg as Partial<QueueMsgChatMsgPush>;
  return typeof msg === "object" &&
    type === "push-chat-notifications" &&
    typeof chatId === "string" &&
    typeof chatMsgId === "string" &&
    typeof pageTitle === "string" &&
    typeof chatUrl === "string";
}

export async function handlePushChatNotifications(msg: QueueMsgChatMsgPush) {
  const nonceEntry = await getQueueNonce(msg.nonce);
  if (!nonceEntry.value) return;
  deleteQueueNonce(msg.nonce);

  const { chatId, chatMsgId, pageTitle, chatUrl } = msg;

  const chatSubs = await listChatSubs({
    kv,
    chatId,
    listOptions: { consistency: "eventual" },
  });

  const chatSubsBySubscriberId = associateBy(
    chatSubs,
    (sub) => sub.subscriberId,
  );

  const subscriberIds = chatSubs
    .filter((sub) => !sub.isSubscriberInChat && !sub.hasCurrentNotification)
    .map((sub) => sub.subscriberId);

  for (const idsChunk of chunk(subscriberIds, 10)) {
    const subscribersEntries = await kv.getMany<Subscriber[]>(
      idsChunk.map((id) => subscribersKeys.byId(id)),
      { consistency: "eventual" },
    );

    const promises: Promise<unknown>[] = [];

    for (const { value: subscriber } of subscribersEntries) {
      try {
        if (!subscriber) continue;
        const chatSub = chatSubsBySubscriberId[subscriber.id];

        if (isChatSubExpired(subscriber)) {
          deleteChatSub({
            chatId,
            subscriberId: subscriber.id,
          }, kv.atomic())
            .commit();
        } else if (subscriber.pushSub?.endpoint) {
          promises.push(
            sendPushNotification(subscriber.pushSub, {
              type: "new-chat-msg",
              chatMsgId,
              chatUrl,
              pageTitle,
            }).then(() => {
              setChatSub({
                ...chatSub,
                hasCurrentNotification: true,
              }, kv.atomic()).commit();
            }),
          );
        }
      } catch (err) {
        console.error(err);
      }
    }
    await Promise.allSettled(promises);
  }
}

function isChatSubExpired(subscriber: Subscriber) {
  return subscriber && !subscriber.pushSub?.endpoint &&
    new Date().getTime() - subscriber.pushSubUpdatedAt.getTime() >
      CHAT_SUB_WITHOUT_PUSH_SUB_EXPIRES;
}
