import { assertSubscriberOnlineEvent } from "../assertions.ts";
import { getChatSub, setChatSub } from "../kv/chat_subs.ts";
import type { ChatEventHandler } from "../types.ts";

export const subscriberOnlineHandler: ChatEventHandler = async (
  event,
  conn,
) => {
  const { chat, kv } = conn;
  assertSubscriberOnlineEvent(event);

  const { skipChatSubUpdate, subscriberId } = event.data;

  if (conn.subscriberId === subscriberId) {
    return null;
  }

  let ok = true;

  if (!skipChatSubUpdate) {
    const chatSubEntry = await getChatSub({
      chatId: chat.id,
      subscriberId,
    }, kv);

    if (chatSubEntry.value) {
      ({ ok } = await setChatSub({
        ...chatSubEntry.value,
        isSubscriberInChat: true,
        hasCurrentNotification: false,
      }, kv.atomic())
        .check(chatSubEntry)
        .commit());
    }
  }

  if (ok) {
    conn.subscriberId = subscriberId;
  }

  return null;
};
