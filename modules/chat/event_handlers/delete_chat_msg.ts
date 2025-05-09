import {
  assertChatEntry,
  assertDeletedChatMsgEvent,
  assertUserEntry,
} from "../util/assertions.ts";
import { getChatMessage } from "../util/kv/chat_messages.ts";
import { setDeletedChatMessage } from "../util/kv/chat_messages_wrappers.ts";
import type {
  ChatEventHandler,
  DeletedChatMsgEventResp,
} from "../util/types.ts";

export const deletedChatMsgHandler: ChatEventHandler<DeletedChatMsgEventResp> =
  async (event, conn) => {
    const { chat, chatUser, kv } = conn;
    assertDeletedChatMsgEvent(event);
    assertChatEntry(chat.kvEntry);
    assertUserEntry(chatUser?.kvEntry);

    const { id } = event.data;
    const msg = (await getChatMessage({ kv, id, chatId: chat.id })).value;
    const isMsgOwner = chatUser.kvEntry.value.username === msg?.username;
    const { canModerate } = conn.perm;

    if (!msg || (!isMsgOwner && !canModerate)) {
      return null;
    }

    const atomic = kv.atomic();
    atomic.check(chat.kvEntry, chatUser.kvEntry);
    setDeletedChatMessage({ msg, atomic });
    const commit = await atomic.commit();

    if (!commit.ok) {
      return deletedChatMsgHandler(event, conn);
    }

    return {
      type: "deleted-chat-msg-resp",
      data: { id },
    };
  };
