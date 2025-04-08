import { pick } from "@std/collections";
import { ulid } from "@std/ulid/ulid";
import type {
  ChatMessage,
  DeletedChatMsgFeedItem,
  EditedChatMessage,
  EditedChatMsgFeedItem,
  NewChatMsgFeedItem,
} from "../types.ts";
import { setChatFeedItem } from "./chat_feed_items.ts";
import { deleteChatMessage, setChatMessage } from "./chat_messages.ts";

// =====================
// Create message
// =====================

interface SetNewChatMessageOptions {
  msg: ChatMessage;
  clientMsgId: string;
  atomic: Deno.AtomicOperation;
}

export function setNewChatMessage(opt: SetNewChatMessageOptions) {
  const { msg, clientMsgId, atomic } = opt;

  const feedItem: NewChatMsgFeedItem = {
    type: "new-chat-msg",
    id: msg.feedItemId,
    chatId: msg.chatId,
    data: {
      clientMsgId,
      ...pick(msg, [
        "id",
        "username",
        "text",
        "createdAt",
      ]),
    },
  };

  setChatMessage(msg, atomic);
  setChatFeedItem(feedItem, atomic);

  return atomic;
}

// =====================
// Edit message
// =====================

interface SetEditedChatMessageOptions {
  editedMsg: EditedChatMessage;
  atomic: Deno.AtomicOperation;
}

export function setEditedChatMessage(opt: SetEditedChatMessageOptions) {
  const { editedMsg, atomic } = opt;

  const feedItem: EditedChatMsgFeedItem = {
    type: "edited-chat-msg",
    id: editedMsg.feedItemId,
    chatId: editedMsg.chatId,
    data: pick(editedMsg, ["id", "text", "editedAt"]),
  };

  setChatMessage(editedMsg, atomic);
  setChatFeedItem(feedItem, atomic);

  return atomic;
}

// =====================
// Delete message
// =====================

interface SetDeletedChatMessageOptions {
  msg: ChatMessage;
  atomic: Deno.AtomicOperation;
}

export function setDeletedChatMessage(opt: SetDeletedChatMessageOptions) {
  const { msg, atomic } = opt;

  const feedItem: DeletedChatMsgFeedItem = {
    type: "deleted-chat-msg",
    id: ulid(),
    chatId: msg.chatId,
    data: pick(msg, ["id", "username"]),
  };

  deleteChatMessage(msg, atomic);
  setChatFeedItem(feedItem, atomic);

  return atomic;
}
