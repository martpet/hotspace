import { pick } from "@std/collections";
import { ulid } from "@std/ulid";
import {
  assertChatEntry,
  assertDeletedChatMsgEvent,
  assertUserEntry,
} from "../assertions.ts";
import { setChatFeedItem } from "../kv/chat_feed_items.ts";
import { deleteChatMessage, getChatMessage } from "../kv/chat_messages.ts";
import type {
  ChatEventHandler,
  DeletedChatMsgEventResp,
  DeletedChatMsgFeedItem,
} from "../types.ts";

export const deletedChatMsgHandler: ChatEventHandler<DeletedChatMsgEventResp> =
  async (event, conn) => {
    const { chatId, chatEntry, userEntry, isAdmin, kv } = conn;
    assertDeletedChatMsgEvent(event);
    assertChatEntry(chatEntry);
    assertUserEntry(userEntry);

    const { id } = event.data;
    const feedItemId = ulid();
    const chatMsg = (await getChatMessage({ chatId, id, kv })).value;
    const isMsgOwner = chatMsg?.username === userEntry.value.username;

    if (!chatMsg || (!isMsgOwner && !isAdmin)) {
      return null;
    }

    const feedItem: DeletedChatMsgFeedItem = {
      type: "deleted-chat-msg",
      id: feedItemId,
      chatId,
      data: pick(chatMsg, ["id", "username"]),
    };

    const atomic = kv.atomic();
    deleteChatMessage(chatMsg, atomic);
    setChatFeedItem(feedItem, atomic);

    const { ok } = await atomic
      .check(chatEntry, userEntry)
      .commit();

    if (!ok) {
      return deletedChatMsgHandler(event, conn);
    }

    return {
      type: "deleted-chat-msg-resp",
      data: { id },
    };
  };
