import { pick } from "@std/collections";
import { ulid } from "@std/ulid";
import {
  assertChatEntry,
  assertEditChatMsgEvent,
  assertUserEntry,
} from "../util/assertions.ts";
import { getChatMessage } from "../util/kv/chat_messages.ts";
import { setEditedChatMessage } from "../util/kv/chat_messages_wrappers.ts";
import sanitizeChatMsgText from "../util/sanitize_msg.ts";
import type {
  ChatEventHandler,
  EditedChatMsgEventResp,
} from "../util/types.ts";

export const editedChatMsgHandler: ChatEventHandler<EditedChatMsgEventResp> =
  async (event, conn) => {
    const { chat, chatUser, kv } = conn;
    assertEditChatMsgEvent(event);
    assertChatEntry(chat.kvEntry);
    assertUserEntry(chatUser?.kvEntry);

    const { id, text } = event.data;

    const feedItemId = ulid();
    const msgEntry = await getChatMessage({ kv, id, chatId: chat.id });
    const msg = msgEntry.value;
    const isMsgOwner = chatUser.kvEntry.value.id === msg?.userId;

    if (!msg || !isMsgOwner) {
      return null;
    }

    const editedMsg = {
      ...msg,
      feedItemId,
      text: sanitizeChatMsgText(text),
      editedAt: new Date(),
    };

    const atomic = kv.atomic();
    atomic.check(msgEntry, chat.kvEntry, chatUser.kvEntry);
    setEditedChatMessage({ editedMsg, atomic });
    const commit = await atomic.commit();

    if (!commit.ok) {
      return editedChatMsgHandler(event, conn);
    }

    return {
      type: "edited-chat-msg-resp",
      data: pick(editedMsg, ["id"]),
    };
  };
