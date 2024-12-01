import {
  ChatSub,
  deleteChatSub,
  listChatSubs,
  type QueueMsgChatMsgPush,
  setChatSub,
} from "$chat";
import { getSemaphore } from "@henrygd/semaphore";
import { PushMessageError } from "@negrel/webpush";
import { delay } from "@std/async";
import { associateBy, chunk } from "@std/collections";
import { STATUS_CODE } from "@std/http";
import { CHAT_SUB_WITHOUT_PUSH_SUB_EXPIRES } from "../../chat.ts";
import type { PushMessage, Subscriber } from "../../types.ts";
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

let pushLock = Promise.resolve();

export async function handlePushChatNotifications(
  queueMsg: QueueMsgChatMsgPush,
) {
  if ((await getQueueNonce(queueMsg.nonce)).value) {
    deleteQueueNonce(queueMsg.nonce);
  } else {
    return;
  }
  const { chatId, chatMsgId, pageTitle, chatUrl } = queueMsg;

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

  for (const chunkedIds of chunk(subscriberIds, 10)) {
    const subscribersEntries = await kv.getMany<Subscriber[]>(
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
          chatUrl,
          pageTitle,
        };
        sendChatPush({ subscriber, chatSub, pushMsg });
        await delay(100);
      }
    }
  }
}

async function sendChatPush({
  subscriber,
  chatSub,
  pushMsg,
}: {
  subscriber: Subscriber;
  chatSub: ChatSub;
  pushMsg: PushMessage;
}) {
  const sem = getSemaphore("chat-push", 10);
  await sem.acquire();

  try {
    if (isChatSubExpired(subscriber)) {
      deleteChatSub(chatSub, kv.atomic()).commit();
    } else if (subscriber.pushSub?.endpoint) {
      await sendPushNotification(subscriber.pushSub, pushMsg);
      const newChatSub = { ...chatSub, hasCurrentNotification: true };
      setChatSub(newChatSub, kv.atomic()).commit();
    }
  } catch (err) {
    if (err instanceof PushMessageError) {
      if (err.response.status === STATUS_CODE.Gone) {
        deleteChatSub(chatSub, kv.atomic()).commit();
      } else if (err.response.status === STATUS_CODE.TooManyRequests) {
        pushLock = delay(1000);
        await pushLock;
        sendChatPush({ subscriber, chatSub, pushMsg });
      }
    } else {
      console.error(err);
    }
  } finally {
    sem.release();
  }
}

function isChatSubExpired(subscriber: Subscriber) {
  return subscriber && !subscriber.pushSub?.endpoint &&
    new Date().getTime() - subscriber.pushSubUpdatedAt.getTime() >
      CHAT_SUB_WITHOUT_PUSH_SUB_EXPIRES;
}
