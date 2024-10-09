import type { AsyncQueue } from "./async_queue.ts";
import type { Space, SpaceItem, User } from "./types.ts";

// =====================
// Chat Message Entry
// =====================

export interface RawChatMessage {
  type: "msg";
  id: string;
  parentId: string;
  feedItemId: string;
  userId: string;
  clientMsgId: string;
  displayName: string;
  text: string;
  editedAt?: Date;
}

export interface ChatMessage extends RawChatMessage {
  createdAt: Date;
}

// =====================
// Chat Feed
// =====================

export type ChatFeedItem =
  | NewChatMsgFeedItem
  | EditedChatMsgFeedItem
  | DeletedChatMsgFeedItem;

export type NewChatMsgFeedItem = {
  type: "new-chat-msg";
  msg: RawChatMessage;
};

export interface EditedChatMsgFeedItem {
  type: "edited-chat-msg";
  msg:
    & Omit<RawChatMessage, "editedAt">
    & Required<Pick<RawChatMessage, "editedAt">>;
}

export interface DeletedChatMsgFeedItem {
  type: "deleted-chat-msg";
  msg: Pick<RawChatMessage, "id" | "parentId" | "feedItemId">;
}

// =====================
// Inbound Event
// =====================

export interface NewChatMsgEvent {
  type: "new-chat-msg";
  clientMsgId: string;
  text: string;
}

export interface DeletedChatMsgEvent {
  type: "deleted-chat-msg";
  msgId: string;
}

export interface LastSeenFeedItemEvent {
  type: "last-seen-feed-item-id";
  feedItemId: string;
}

// =====================
// Inbound Event Response
// =====================

export type InboundEventResp =
  | NewChatMsgEventResp
  | DeletedChatMsgEventResp
  | null;

export interface NewChatMsgEventResp {
  type: "new-chat-msg-resp";
  msgId: string;
  clientMsgId: string;
}

export interface DeletedChatMsgEventResp {
  type: "deleted-chat-msg-resp";
  msgId: string;
}

// =====================
// Outbound Data
// =====================

export type OutboundData = InboundEventResp | OutboundError | OutboundFeedItems;

export interface OutboundError {
  type: "error";
  errorName: string;
}

export interface OutboundFeedItems {
  type: "feed-items";
  items: ChatFeedItem[];
}

// =====================
// Chat Context
// =====================

export interface ChatContext {
  dispatch: (data: OutboundData) => void;
  readers: ReadableStreamDefaultReader[];
  inboundQueue: AsyncQueue<InboundEventResp>;
  spaceId: string;
  spaceItemId?: string;
  parentId: string;
  userId?: string;
  state: {
    lastSeenFeedItemId: string | null;
    userEntry?: Deno.KvEntryMaybe<User>;
    spaceEntry?: Deno.KvEntryMaybe<Space>;
    spaceItemEntry?: Deno.KvEntryMaybe<SpaceItem>;
  };
}

export type ChatCRUDContext =
  & Omit<ChatContext, "state">
  & {
    state:
      & Omit<
        ChatContext["state"],
        "userEntry" | "spaceEntry" | "spaceItemEntry"
      >
      & {
        userEntry: Deno.KvEntry<User>;
        spaceEntry: Deno.KvEntry<Space>;
        spaceItemEntry?: Deno.KvEntry<SpaceItem>;
      };
  };
