import {
  ChatSub,
  deleteChatSub,
  listChatSubs,
  type PushChatNotificationQueueMsg,
  setChatSub,
} from "$chat";
import { getSemaphore } from "@henrygd/semaphore";
import { PushMessageError } from "@negrel/webpush";
import { delay } from "@std/async";
import { associateBy, chunk } from "@std/collections";
import { STATUS_CODE } from "@std/http";
import { CHAT_SUB_WITHOUT_PUSH_SUB_EXPIRES } from "../../consts.ts";
import type { PushMessage, PushSubscriber } from "../../types.ts";
import { sendPushNotification } from "../../webpush.ts";
import { deleteQueueNonce, getQueueNonce } from "../enqueue.ts";
import { kv } from "../kv.ts";
import { keys as subscribersKeys } from "../push_subscribers.ts";

export function isPushChatNotification(
  msg: unknown,
): msg is PushChatNotificationQueueMsg {
  const { type, chatId, chatMsgId, chatTitle, chatPageUrl } = msg as Partial<
    PushChatNotificationQueueMsg
  >;
  return typeof msg === "object" &&
    type === "push-chat-notification" &&
    typeof chatId === "string" &&
    typeof chatMsgId === "string" &&
    typeof chatTitle === "string" &&
    typeof chatPageUrl === "string";
}

let pushLock = Promise.resolve();

export async function handlePushChatNotification(
  queueMsg: PushChatNotificationQueueMsg,
) {
  const nonceEntry = await getQueueNonce(queueMsg.nonce);
  if (nonceEntry.value) {
    deleteQueueNonce(queueMsg.nonce);
  } else {
    return;
  }
  const { chatId, chatMsgId, chatTitle, chatPageUrl } = queueMsg;

  const chatSubs = await listChatSubs({
    kv,
    chatId,
    listOptions: {
      consistency: "eventual",
    },
  });

  const chatSubsBySubscriber = associateBy(chatSubs, (sub) => sub.subscriberId);

  const subscriberIds = chatSubs
    .filter((sub) => !sub.isSubscriberInChat && !sub.hasCurrentNotification)
    .map((sub) => sub.subscriberId);

  const promises: Promise<unknown>[] = [];

  for (const chunkedIds of chunk(subscriberIds, 10)) {
    const subscribersEntries = await kv.getMany<PushSubscriber[]>(
      chunkedIds.map((id) => subscribersKeys.byId(id)),
      { consistency: "eventual" },
    );
    for (const { value: subscriber } of subscribersEntries) {
      if (subscriber) {
        await pushLock;
        const chatSub = chatSubsBySubscriber[subscriber.id];
        const pushMsg = {
          type: "new-chat-msg",
          chatMsgId,
          chatPageUrl,
          chatTitle,
        };
        promises.push(sendChatPush({ subscriber, chatSub, pushMsg }));
        await delay(100);
      }
    }
  }
  await Promise.allSettled(promises);
}

async function sendChatPush({
  subscriber,
  chatSub,
  pushMsg,
}: {
  subscriber: PushSubscriber;
  chatSub: ChatSub;
  pushMsg: PushMessage;
}) {
  const sem = getSemaphore("push-chat-notification", 10);
  await sem.acquire();

  try {
    if (isChatSubExpired(subscriber)) {
      return deleteChatSub(chatSub, kv.atomic()).commit();
    }
    if (subscriber.pushSub?.endpoint) {
      await sendPushNotification(subscriber.pushSub, pushMsg);
      const newChatSub = { ...chatSub, hasCurrentNotification: true };
      return setChatSub(newChatSub, kv.atomic()).commit();
    }
  } catch (err) {
    const isPushErr = err instanceof PushMessageError;

    if (isPushErr && err.response.status === STATUS_CODE.Gone) {
      return deleteChatSub(chatSub, kv.atomic()).commit();
    }
    if (isPushErr && err.response.status === STATUS_CODE.TooManyRequests) {
      pushLock = delay(1000);
      await pushLock;
      return sendChatPush({ subscriber, chatSub, pushMsg });
    }
    console.error(err);
  } finally {
    sem.release();
  }
}

function isChatSubExpired(subscriber: PushSubscriber) {
  return subscriber && !subscriber.pushSub && subscriber.pushSubUpdatedAt &&
    new Date().getTime() - subscriber.pushSubUpdatedAt.getTime() >
      CHAT_SUB_WITHOUT_PUSH_SUB_EXPIRES;
}
