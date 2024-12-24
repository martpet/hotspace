import { pick } from "@std/collections";
import { ulid } from "@std/ulid";
import {
  assertChatEntry,
  assertEditChatMsgEvent,
  assertUserEntry,
} from "../util/assertions.ts";
import { setChatFeedItem } from "../util/kv/chat_feed_items.ts";
import { getChatMessage, setChatMessage } from "../util/kv/chat_messages.ts";
import sanitizeChatMsgText from "../util/sanitize_msg.ts";
import type {
  ChatEventHandler,
  EditedChatMsgEventResp,
  EditedChatMsgFeedItem,
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
    const isMsgOwner = chatUser.kvEntry.value.username === msg?.username;

    if (!msg || !isMsgOwner) {
      return null;
    }

    const editedMsg = {
      ...msg,
      feedItemId,
      text: sanitizeChatMsgText(text),
      editedAt: new Date(),
    };

    const feedItem: EditedChatMsgFeedItem = {
      type: "edited-chat-msg",
      id: feedItemId,
      chatId: chat.id,
      data: pick(editedMsg, ["id", "text", "editedAt"]),
    };

    const atomic = kv.atomic();
    setChatMessage(editedMsg, atomic);
    setChatFeedItem(feedItem, atomic);

    const { ok } = await atomic
      .check(msgEntry, chat.kvEntry, chatUser.kvEntry)
      .commit();

    if (!ok) {
      return editedChatMsgHandler(event, conn);
    }

    return {
      type: "edited-chat-msg-resp",
      data: pick(editedMsg, ["id"]),
    };
  };
