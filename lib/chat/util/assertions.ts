import type { UnknownValues } from "$util";
import { CHAT_MESSAGE_CONTRAINTS } from "./consts.ts";

import {
  BadEditedChatMsgEventData,
  BadLastSeenFeedIdebEventData,
  BadLoadOlderMessagesEventData,
  BadNewChatMsgEventData,
  BadSubscriberOnlineEventData,
  BadUserTypingEventData,
  ChatDisabledError,
  ChatNotFoundError,
  InvalidChatMsgTextError,
  UserNotFoundError,
} from "./errors.ts";
import type {
  ChatEventBase,
  ChatResource,
  ChatUserResource,
  DeletedChatMsgEvent,
  EditedChatMsgEvent,
  LastSeenFeedItemEvent,
  LoadOlderMessagesEvent,
  NewChatMsgEvent,
  SubscriberOnlineEvent,
  UserTypingEvent,
} from "./types.ts";

export function assertChatEntry(
  chatEntry?: Deno.KvEntryMaybe<ChatResource>,
): asserts chatEntry is Deno.KvEntry<ChatResource> {
  if (!chatEntry?.value) {
    throw new ChatNotFoundError();
  }
  if (!chatEntry.value.chatEnabled) {
    throw new ChatDisabledError();
  }
}

export function assertUserEntry(
  userEntry?: Deno.KvEntryMaybe<ChatUserResource>,
): asserts userEntry is Deno.KvEntry<ChatUserResource> {
  if (!userEntry?.value) {
    throw new UserNotFoundError();
  }
}

export function assertNewChatMsgEvent(
  event: ChatEventBase,
): asserts event is NewChatMsgEvent {
  const { text, clientMsgId } = event.data as UnknownValues<
    NewChatMsgEvent["data"]
  >;
  assertChatMsgTextValidity(text);
  if (typeof event.data !== "object" || typeof clientMsgId !== "string") {
    throw new BadNewChatMsgEventData();
  }
}

export function assertEditChatMsgEvent(
  event: ChatEventBase,
): asserts event is EditedChatMsgEvent {
  const { id, text } = event.data as UnknownValues<EditedChatMsgEvent["data"]>;
  assertChatMsgTextValidity(text);
  if (typeof event.data !== "object" || typeof id !== "string") {
    throw new BadEditedChatMsgEventData();
  }
}

export function assertDeletedChatMsgEvent(
  event: ChatEventBase,
): asserts event is DeletedChatMsgEvent {
  const { id } = event.data as UnknownValues<DeletedChatMsgEvent["data"]>;
  if (typeof event.data !== "object" || typeof id !== "string") {
    throw new BadEditedChatMsgEventData();
  }
}

export function assertLastSeenFeedItemEvent(
  event: ChatEventBase,
): asserts event is LastSeenFeedItemEvent {
  const { id } = event.data as UnknownValues<LastSeenFeedItemEvent["data"]>;
  if (typeof event.data !== "object" || typeof id !== "string") {
    throw new BadLastSeenFeedIdebEventData();
  }
}

export function assertLoadOlderMessagesEvent(
  event: ChatEventBase,
): asserts event is LoadOlderMessagesEvent {
  const { olderMsgsCursor } = event.data as UnknownValues<
    LoadOlderMessagesEvent["data"]
  >;
  if (typeof event.data !== "object" || typeof olderMsgsCursor !== "string") {
    throw new BadLoadOlderMessagesEventData();
  }
}

export function assertUserTypingEvent(
  event: ChatEventBase,
): asserts event is UserTypingEvent {
  const { username } = event.data as UnknownValues<UserTypingEvent["data"]>;
  if (typeof event.data !== "object" || typeof username !== "string") {
    throw new BadUserTypingEventData();
  }
}

export function assertSubscriberOnlineEvent(
  event: ChatEventBase,
): asserts event is SubscriberOnlineEvent {
  const { subscriberId, skipChatSubUpdate } = event.data as UnknownValues<
    SubscriberOnlineEvent["data"]
  >;
  if (
    typeof event.data !== "object" || typeof subscriberId !== "string" ||
    (typeof skipChatSubUpdate !== "undefined" &&
      typeof skipChatSubUpdate !== "boolean")
  ) {
    throw new BadSubscriberOnlineEventData();
  }
}

export function assertChatMsgTextValidity(
  text: unknown,
): asserts text is string {
  const { pattern, maxLength } = CHAT_MESSAGE_CONTRAINTS;
  if (
    typeof text !== "string" ||
    text.length > maxLength ||
    !new RegExp(pattern).test(text)
  ) throw new InvalidChatMsgTextError();
}
