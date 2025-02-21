import { pick } from "@std/collections";
import { ulid } from "@std/ulid";
import {
  assertChatEntry,
  assertDeletedChatMsgEvent,
  assertUserEntry,
} from "../util/assertions.ts";
import { setChatFeedItem } from "../util/kv/chat_feed_items.ts";
import { deleteChatMessage, getChatMessage } from "../util/kv/chat_messages.ts";
import type {
  ChatEventHandler,
  DeletedChatMsgEventResp,
  DeletedChatMsgFeedItem,
} from "../util/types.ts";

export const deletedChatMsgHandler: ChatEventHandler<DeletedChatMsgEventResp> =
  async (event, conn) => {
    const { chat, chatUser, isAdmin, kv } = conn;
    assertDeletedChatMsgEvent(event);
    assertChatEntry(chat.kvEntry);
    assertUserEntry(chatUser?.kvEntry);

    const { id } = event.data;
    const feedItemId = ulid();
    const msg = (await getChatMessage({ kv, id, chatId: chat.id })).value;
    const isMsgOwner = chatUser.kvEntry.value.username === msg?.username;

    if (!msg || (!isMsgOwner && !isAdmin)) {
      return null;
    }

    const feedItem: DeletedChatMsgFeedItem = {
      type: "deleted-chat-msg",
      id: feedItemId,
      chatId: chat.id,
      data: pick(msg, ["id", "username"]),
    };

    const atomic = kv.atomic();
    atomic.check(chat.kvEntry, chatUser.kvEntry);
    deleteChatMessage(msg, atomic);
    setChatFeedItem(feedItem, atomic);

    const commit = await atomic.commit();

    if (!commit.ok) {
      return deletedChatMsgHandler(event, conn);
    }

    return {
      type: "deleted-chat-msg-resp",
      data: { id },
    };
  };
