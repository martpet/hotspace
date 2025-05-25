import type { AclResource, AsyncQueue, MaybePromise } from "$util";
import type { ChatConnection } from "../ChatConnection.ts";

export interface ChatResource extends AclResource {
  chatEnabled?: boolean;
}

export interface ChatUserResource {
  id: string;
  username: string;
}

export interface RawChatMessage {
  id: string;
  chatId: string;
  feedItemId: string;
  username: string;
  userId: string;
  text: string;
  editedAt?: Date;
}

export interface ChatMessage extends RawChatMessage {
  createdAt: Date;
}

export type EditedChatMessage =
  & Omit<ChatMessage, "editedAt">
  & Required<Pick<ChatMessage, "editedAt">>;

export interface ChatSub {
  chatId: string;
  subscriberId: string;
  isSubscriberInChat?: boolean;
  hasCurrentNotification?: boolean;
}

export interface QueueMsgPushChatNotification {
  type: "push-chat-notification";
  chatId: string;
  chatMsgId: string;
  chatTitle: string;
  chatPageUrl: string;
}

export type ValidChatConnection = Omit<ChatConnection, "chatEntry"> & {
  chatEntry: Deno.KvEntry<ChatResource>;
};

export type ChatConnectionWithUser = Omit<ValidChatConnection, "userEntry"> & {
  userEntry: Deno.KvEntry<ChatUserResource>;
};

export type KvEnqueueFn = (
  msg: { type: string; nonce?: string },
  atomic: Deno.AtomicOperation,
) => Deno.AtomicOperation;

// =====================
// Chat Event
// =====================

export interface ChatEventBase {
  type: string;
  data?: unknown;
}

export type ChatEventHandler<T = OutboundChatEvent> = (
  event: ChatEventBase,
  connection: ChatConnection,
) => MaybePromise<T | null>;

export type HandlerConfig = {
  handler: ChatEventHandler;
  options?: { queue?: AsyncQueue };
};

// =====================
// Inbound Events
// =====================

export type InboundChatEvent =
  | NewChatMsgEvent
  | EditedChatMsgEvent
  | DeletedChatMsgEvent
  | LastSeenFeedItemEvent
  | LoadOlderMessagesEvent
  | UserTypingEvent
  | SubscriberOnlineEvent;

export interface NewChatMsgEvent extends ChatEventBase {
  type: "new-chat-msg";
  data: Pick<ChatMessage, "text"> & { clientMsgId: string };
}

export interface EditedChatMsgEvent extends ChatEventBase {
  type: "edited-chat-msg";
  data: Pick<ChatMessage, "id" | "text">;
}

export interface DeletedChatMsgEvent extends ChatEventBase {
  type: "deleted-chat-msg";
  data: Pick<ChatMessage, "id">;
}

export interface LastSeenFeedItemEvent extends ChatEventBase {
  type: "last-seen-feed-item";
  data: { id: string };
}

export interface LoadOlderMessagesEvent extends ChatEventBase {
  type: "load-older-messages";
  data: { olderMsgsCursor: string };
}

export interface UserTypingEvent extends ChatEventBase {
  type: "user-typing";
  data: {
    username: string;
    lastUserMsgId?: string;
  };
}

export interface SubscriberOnlineEvent extends ChatEventBase {
  type: "subscriber-online";
  data: {
    subscriberId: string;
    skipChatSubUpdate?: boolean;
  };
}

// =====================
// Outbound Events
// =====================

export type OutboundChatEvent =
  | ChatReadyEvent
  | NewChatMsgEventResp
  | EditedChatMsgEventResp
  | DeletedChatMsgEventResp
  | LoadOlderMessagesEventResp
  | UserTypingEvent
  | FeedebEvent
  | ErrorEvent;

export interface ChatReadyEvent extends ChatEventBase {
  type: "chat-ready";
}

export interface NewChatMsgEventResp extends ChatEventBase {
  type: "new-chat-msg-resp";
  data: Pick<ChatMessage, "id"> & { clientMsgId: string };
}

export interface EditedChatMsgEventResp extends ChatEventBase {
  type: "edited-chat-msg-resp";
  data: Pick<ChatMessage, "id">;
}

export interface DeletedChatMsgEventResp extends ChatEventBase {
  type: "deleted-chat-msg-resp";
  data: Pick<ChatMessage, "id">;
}

export interface LoadOlderMessagesEventResp extends ChatEventBase {
  type: "load-older-messages-resp";
  data: {
    messages: ChatMessage[];
    nextCursor: string | null;
  };
}

export interface FeedebEvent extends ChatEventBase {
  type: "feed";
  data: ChatFeedItem[];
}

export interface ErrorEvent extends ChatEventBase {
  type: "error";
  data?: { name?: string };
}

// =====================
// Outbound BroadcastChannel Event
// =====================

export type OutboundBcChannelChatEvent = UserTypingEvent;

// =====================
// Feed
// =====================

export type ChatFeedItem =
  | NewChatMsgFeedItem
  | EditedChatMsgFeedItem
  | DeletedChatMsgFeedItem;

interface FeedItemBase {
  type: string;
  id: string;
  chatId: string;
  data: unknown;
}

export interface NewChatMsgFeedItem extends FeedItemBase {
  type: "new-chat-msg";
  data:
    & Pick<ChatMessage, "id" | "username" | "text" | "createdAt">
    & { clientMsgId: string };
}

export interface EditedChatMsgFeedItem extends FeedItemBase {
  type: "edited-chat-msg";
  data:
    & Pick<ChatMessage, "id" | "text">
    & { editedAt: Date };
}

export interface DeletedChatMsgFeedItem extends FeedItemBase {
  type: "deleted-chat-msg";
  data: Pick<ChatMessage, "id" | "username">;
}
