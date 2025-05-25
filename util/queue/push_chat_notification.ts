import {
  ChatSub,
  deleteChatSub,
  listChatSubs,
  type QueueMsgPushChatNotification,
  setChatSub,
} from "$chat";
import { getPermissions } from "$util";
import { newQueue } from "@henrygd/queue";
import { PushMessageError } from "@negrel/webpush";
import { retry } from "@std/async/retry";
import { associateBy, chunk } from "@std/collections";
import { STATUS_CODE } from "@std/http";
import { CHAT_SUB_WITHOUT_PUSH_SUB_EXPIRES } from "../../util/consts.ts";
import { getInodeById } from "../../util/kv/inodes.ts";
import { kv } from "../../util/kv/kv.ts";
import { keys as subscribersKeys } from "../../util/kv/push_subscribers.ts";
import type { PushMessage, PushSubscriber } from "../../util/types.ts";
import { sendPushNotification } from "../../util/webpush.ts";

export function isPushChatNotification(
  msg: unknown,
): msg is QueueMsgPushChatNotification {
  const {
    type,
    chatId,
    chatMsgId,
    chatTitle,
    chatPageUrl,
  } = msg as Partial<QueueMsgPushChatNotification>;

  return typeof msg === "object" &&
    type === "push-chat-notification" &&
    typeof chatId === "string" &&
    typeof chatMsgId === "string" &&
    typeof chatTitle === "string" &&
    typeof chatPageUrl === "string";
}

export async function handlePushChatNotification(
  {
    chatId,
    chatMsgId,
    chatTitle,
    chatPageUrl,
  }: QueueMsgPushChatNotification,
) {
  const [inodeEntry, chatSubs] = await Promise.all([
    getInodeById(chatId, { consistency: "eventual" }),
    listChatSubs({
      chatId,
      listOptions: { consistency: "eventual" },
      kv,
    }),
  ]);

  if (!inodeEntry.value) {
    return;
  }

  const chatSubsBySubscriber = associateBy(chatSubs, (s) => s.subscriberId);

  const subscriberIds = chatSubs
    .filter((chatSub) =>
      !chatSub.isSubscriberInChat &&
      !chatSub.hasCurrentNotification
    )
    .map((chatSub) => chatSub.subscriberId);

  const pushMsgData: {
    subscriber: PushSubscriber;
    chatSub: ChatSub;
    pushMsg: PushMessage;
  }[] = [];

  for (const idChunk of chunk(subscriberIds, 10)) {
    const kvKeys = idChunk.map((id) => subscribersKeys.byId(id));
    const subscriberEntries = await kv.getMany<PushSubscriber[]>(kvKeys, {
      consistency: "eventual",
    });
    for (const { value: subscriber } of subscriberEntries) {
      if (!subscriber) {
        continue;
      }
      const perm = getPermissions({
        user: subscriber.userId ? { id: subscriber.userId } : null,
        resource: inodeEntry.value,
      });
      if (!perm.canRead) {
        continue;
      }
      pushMsgData.push({
        subscriber,
        chatSub: chatSubsBySubscriber[subscriber.id],
        pushMsg: {
          type: "new-chat-msg",
          chatMsgId,
          chatPageUrl,
          chatTitle,
        },
      });
    }
  }

  const queue = newQueue(10);

  for (const item of pushMsgData) {
    const { subscriber, chatSub, pushMsg } = item;

    queue.add(() =>
      retry(async () => {
        if (isChatSubExpired(subscriber)) {
          return deleteChatSub(chatSub, kv.atomic()).commit();
        }
        if (!subscriber.pushSub) {
          return;
        }
        try {
          await sendPushNotification(subscriber.pushSub, pushMsg);
          return setChatSub(
            { ...chatSub, hasCurrentNotification: true },
            kv.atomic(),
          ).commit();
        } catch (err) {
          if (
            err instanceof PushMessageError &&
            err.response.status === STATUS_CODE.Gone
          ) {
            return deleteChatSub(chatSub, kv.atomic()).commit();
          }

          throw err;
        }
      })
    );
  }

  return queue.done();
}

function isChatSubExpired(subscriber: PushSubscriber) {
  return subscriber && !subscriber.pushSub && subscriber.pushSubUpdatedAt &&
    Date.now() - subscriber.pushSubUpdatedAt.getTime() >
      CHAT_SUB_WITHOUT_PUSH_SUB_EXPIRES;
}
