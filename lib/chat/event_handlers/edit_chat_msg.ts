import { pick } from "@std/collections";
import { ulid } from "@std/ulid";
import {
  assertChatEntry,
  assertEditChatMsgEvent,
  assertUserEntry,
} from "../assertions.ts";
import { setChatFeedItem } from "../kv/chat_feed_items.ts";
import { getChatMessage, setChatMessage } from "../kv/chat_messages.ts";
import sanitizeChatMsgText from "../sanitize_msg.ts";
import type {
  ChatEventHandler,
  EditedChatMsgEventResp,
  EditedChatMsgFeedItem,
} from "../types.ts";

export const editedChatMsgHandler: ChatEventHandler<EditedChatMsgEventResp> =
  async (event, conn) => {
    const { chatId, chatEntry, userEntry, kv } = conn;
    assertEditChatMsgEvent(event);
    assertChatEntry(chatEntry);
    assertUserEntry(userEntry);

    const { id, text } = event.data;

    const feedItemId = ulid();
    const msgEntry = await getChatMessage({ chatId, id, kv });
    const msg = msgEntry.value;
    const canEdit = userEntry.value.username === msg?.username;

    if (!msg || !canEdit) {
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
      chatId,
      data: pick(editedMsg, ["id", "text", "editedAt"]),
    };

    const atomic = kv.atomic();
    setChatMessage(editedMsg, atomic);
    setChatFeedItem(feedItem, atomic);

    const { ok } = await atomic
      .check(msgEntry, chatEntry, userEntry)
      .commit();

    if (!ok) {
      return editedChatMsgHandler(event, conn);
    }

    return {
      type: "edited-chat-msg-resp",
      data: pick(editedMsg, ["id"]),
    };
  };
