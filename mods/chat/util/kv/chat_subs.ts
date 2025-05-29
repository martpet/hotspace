import type { ChatSub } from "../types.ts";

export const keys = {
  byChat: (
    chatId: string,
    subscriberId: string,
  ) => ["chat_subs_by_chat", chatId, subscriberId],

  bySubscriber: (
    subscriberId: string,
    chatId: string,
  ) => ["chat_subs_by_subscriber", subscriberId, chatId],
};

export function setChatSub(chatSub: ChatSub, atomic: Deno.AtomicOperation) {
  return atomic
    .set(keys.byChat(chatSub.chatId, chatSub.subscriberId), chatSub)
    .set(keys.bySubscriber(chatSub.subscriberId, chatSub.chatId), chatSub);
}

export function deleteChatSub(
  chatSub: Pick<ChatSub, "subscriberId" | "chatId">,
  atomic: Deno.AtomicOperation,
) {
  return atomic
    .delete(keys.byChat(chatSub.chatId, chatSub.subscriberId))
    .delete(keys.bySubscriber(chatSub.subscriberId, chatSub.chatId));
}

export function getChatSub(
  chatSub: Pick<ChatSub, "subscriberId" | "chatId">,
  kv: Deno.Kv,
) {
  return kv.get<ChatSub>(keys.byChat(chatSub.chatId, chatSub.subscriberId));
}

export function listChatSubs(options: {
  chatId: string;
  kv: Deno.Kv;
  listOptions?: Deno.KvListOptions;
}) {
  const { chatId, kv, listOptions } = options;
  const prefix = keys.byChat(chatId, "").slice(0, -1);
  const iter = kv.list<ChatSub>({ prefix }, listOptions);
  return Array.fromAsync(iter, (it) => it.value);
}
