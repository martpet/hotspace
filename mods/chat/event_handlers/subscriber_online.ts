import { assertSubscriberOnlineEvent } from "../util/assertions.ts";
import { getChatSub, setChatSub } from "../util/kv/chat_subs.ts";
import type { ChatEventHandler } from "../util/types.ts";

export const subscriberOnlineHandler: ChatEventHandler = async (
  event,
  conn,
) => {
  const { chat, kv } = conn;
  assertSubscriberOnlineEvent(event);

  const { skipChatSubUpdate, subscriberId } = event.data;
  const { canRead } = conn.perm;

  if (conn.subscriberId === subscriberId || !canRead) {
    return null;
  }

  let commit = { ok: true };

  if (!skipChatSubUpdate) {
    const chatSubEntry = await getChatSub(
      { chatId: chat.id, subscriberId },
      kv,
    );
    const chatSub = chatSubEntry.value;
    if (chatSub) {
      const newChatSub = {
        ...chatSub,
        isSubscriberInChat: true,
        hasCurrentNotification: false,
      };
      const atomic = kv.atomic();
      atomic.check(chatSubEntry);
      setChatSub(newChatSub, atomic);
      commit = await atomic.commit();
    }
  }

  if (commit.ok) {
    conn.subscriberId = subscriberId;
  }

  return null;
};
