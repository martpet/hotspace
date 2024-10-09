import { distinctBy, pick } from "@std/collections";
import { STATUS_CODE } from "@std/http";
import { ulid } from "@std/ulid";
import { AsyncQueue } from "../../util/async_queue.ts";
import type {
  ChatContext,
  ChatCRUDContext,
  DeletedChatMsgEvent,
  DeletedChatMsgEventResp,
  DeletedChatMsgFeedItem,
  InboundEventResp,
  LastSeenFeedItemEvent,
  NewChatMsgEvent,
  NewChatMsgEventResp,
  NewChatMsgFeedItem,
  OutboundData,
  OutboundError,
  RawChatMessage,
} from "../../util/chat_types.ts";
import { CHAT_MESSAGE_CONTRAINTS } from "../../util/constraints.ts";
import {
  keys as chatFeedKeys,
  listChatFeedItems,
  setChatFeedItem,
} from "../../util/db/chat_feed_items.ts";
import {
  deleteChatMessage,
  getChatMessage,
  setChatMessage,
} from "../../util/db/chat_messages.ts";
import { kv } from "../../util/db/kv.ts";
import { keys as spaceItemKeys } from "../../util/db/space_items.ts";
import { keys as spaceKeys } from "../../util/db/spaces.ts";
import { keys as userKeys } from "../../util/db/users.ts";
import type { AppContext, Space, SpaceItem, User } from "../../util/types.ts";

export default function chat(ctx: AppContext) {
  if (ctx.req.headers.get("upgrade") !== "websocket") {
    return ctx.respond(null, STATUS_CODE.UpgradeRequired);
  }

  const { socket, response } = Deno.upgradeWebSocket(ctx.req);
  const urlParams = new URLSearchParams(ctx.url.search);
  const spaceId = ctx.urlPatternResult.pathname.groups.spaceId!;
  const spaceItemId = ctx.urlPatternResult.pathname.groups.spaceItemId;
  const dispatch = (data: OutboundData) => socket.send(JSON.stringify(data));

  const chatCtx: ChatContext = {
    dispatch,
    inboundQueue: new AsyncQueue(),
    readers: [],
    userId: ctx.state.user?.id,
    spaceId,
    spaceItemId,
    parentId: spaceItemId || spaceId,
    state: {
      lastSeenFeedItemId: urlParams.get("lastSeenFeedItemId"),
    },
  };

  watchChatFeed(chatCtx);
  watchUserEntry(chatCtx);
  watchSpaceEntry(chatCtx);
  watchSpaceItemEntry(chatCtx);

  socket.addEventListener("message", async ({ data }) => {
    let resp: InboundEventResp | OutboundError;
    try {
      resp = await inboundEventHandler(JSON.parse(data), chatCtx);
    } catch (err) {
      resp = { type: "error", errorName: "" };
      if (err instanceof ClientError) {
        resp.errorName = err.name;
      } else {
        console.error(err);
      }
    }
    if (resp) dispatch(resp);
  });

  socket.addEventListener("close", () => {
    chatCtx.readers.forEach((r) => r.cancel());
  });

  return response;
}

// =====================
// Inbound Event Handler
// =====================

function inboundEventHandler(
  data: unknown,
  ctx: ChatContext,
): InboundEventResp | Promise<InboundEventResp> {
  const { inboundQueue: queue } = ctx;
  if (isNewChatMsgEvent(data)) {
    return queue.add(() => handleNewChatMsg(data, ctx));
  } else if (isDeletedChatMsgEvent(data)) {
    return queue.add(() => handleDeletedChatMsg(data, ctx));
  } else if (isLastSeenFeedItemEvent(data)) {
    return handleLastSeenFeedItem(data, ctx);
  } else {
    throw new BadInboundDataError();
  }
}

// =====================
// New Chat Msg Handler
// =====================

async function handleNewChatMsg(
  data: NewChatMsgEvent,
  ctx: ChatContext,
): Promise<NewChatMsgEventResp> {
  assertContext(ctx);

  const { clientMsgId, text } = data;
  const { parentId } = ctx;
  const { userEntry, spaceEntry, spaceItemEntry } = ctx.state;
  const feedItemId = ulid();

  const msg: RawChatMessage = {
    type: "msg",
    id: ulid(),
    feedItemId,
    clientMsgId,
    parentId,
    userId: userEntry.value.id,
    displayName: userEntry.value.username,
    text: sanitizeMsgText(text),
  };

  const feedItem: NewChatMsgFeedItem = {
    type: "new-chat-msg",
    msg,
  };

  const checks: Deno.AtomicCheck[] = [userEntry, spaceEntry];

  if (spaceItemEntry) {
    checks.push(spaceItemEntry);
  }

  const atomic = kv.atomic();
  setChatMessage(msg, atomic);
  setChatFeedItem(feedItem, atomic);
  atomic.check(...checks);
  const commit = await atomic.commit();

  if (!commit.ok) {
    return handleNewChatMsg(data, ctx);
  }

  ctx.state.lastSeenFeedItemId = feedItemId;

  return {
    type: "new-chat-msg-resp",
    msgId: msg.id,
    clientMsgId,
  };
}

// =====================
// Deleted Chat Msg Handler
// =====================

async function handleDeletedChatMsg(
  data: DeletedChatMsgEvent,
  ctx: ChatContext,
): Promise<DeletedChatMsgEventResp | null> {
  assertContext(ctx);

  const { parentId } = ctx;
  const { userEntry, spaceEntry, spaceItemEntry } = ctx.state;
  const msgEntry = await getChatMessage({ parentId, id: data.msgId });
  const msg = msgEntry.value;
  const feedItemId = ulid();

  if (!msg || msg.userId !== userEntry.value.id) {
    return null;
  }

  const checks: Deno.AtomicCheck[] = [userEntry, spaceEntry];

  if (spaceItemEntry) {
    checks.push(spaceItemEntry);
  }

  const feedItem: DeletedChatMsgFeedItem = {
    type: "deleted-chat-msg",
    msg: pick(msg, ["id", "parentId", "feedItemId"]),
  };

  const atomic = kv.atomic();
  deleteChatMessage(msg, atomic);
  setChatFeedItem(feedItem, atomic);
  atomic.check(...checks);
  const commit = await atomic.commit();

  if (!commit.ok) {
    return handleDeletedChatMsg(data, ctx);
  }

  ctx.state.lastSeenFeedItemId = feedItemId;

  return {
    type: "deleted-chat-msg-resp",
    msgId: msg.id,
  };
}

// =====================
// Last Seen Feed Item Handler
// =====================

function handleLastSeenFeedItem(data: LastSeenFeedItemEvent, ctx: ChatContext) {
  ctx.state.lastSeenFeedItemId = data.feedItemId;
  return null;
}

// =====================
// Checks
// =====================

function isNewChatMsgEvent(data: unknown): data is NewChatMsgEvent {
  const { type, text, clientMsgId } = data as Partial<NewChatMsgEvent>;
  const { pattern, maxLength } = CHAT_MESSAGE_CONTRAINTS;
  return typeof data === "object" &&
    type === "new-chat-msg" &&
    typeof clientMsgId === "string" &&
    typeof text === "string" &&
    text.length <= maxLength &&
    new RegExp(pattern).test(text);
}

function isDeletedChatMsgEvent(data: unknown): data is DeletedChatMsgEvent {
  const { type, msgId } = data as Partial<DeletedChatMsgEvent>;
  return typeof data === "object" &&
    type === "deleted-chat-msg" &&
    typeof msgId === "string";
}

function isLastSeenFeedItemEvent(data: unknown): data is LastSeenFeedItemEvent {
  const { type, feedItemId } = data as Partial<LastSeenFeedItemEvent>;
  return typeof data === "object" &&
    type === "last-seen-feed-item-id" &&
    typeof feedItemId === "string";
}

// =====================
// Assertions
// =====================

function assertContext(
  ctx: ChatContext,
): asserts ctx is ChatCRUDContext {
  const { spaceItemId } = ctx;
  const { userEntry, spaceEntry, spaceItemEntry } = ctx.state;
  if (!userEntry?.value) {
    throw new UserNotFoundError();
  } else if (!spaceEntry?.value) {
    throw new SpaceNotFoundError();
  } else if (spaceItemId && !spaceItemEntry?.value) {
    throw new SpaceItemNotFoundError();
  } else if (spaceItemId && !spaceItemEntry?.value?.chatEnabled) {
    throw new ChatDisabledError();
  } else if (!spaceEntry?.value.chatEnabled) {
    throw new ChatDisabledError();
  }
}

// =====================
// Kv Watchers
// =====================

function watchChatFeed(ctx: ChatContext) {
  const { parentId } = ctx;
  const key = chatFeedKeys.lastItemIdByChat(parentId);
  ctx.readers.push(watchKv<[string]>([key], async ([entry]) => {
    const lastId = entry.value;
    const lastSeenId = ctx.state.lastSeenFeedItemId;
    if (!lastId || lastId === lastSeenId) return;
    const start = chatFeedKeys.byChat(parentId, lastSeenId || "");
    const items = await listChatFeedItems(parentId, { start });
    if (lastSeenId) items.shift();
    const reversedItems = items.toReversed();
    const distinct = distinctBy(reversedItems, ({ msg }) => msg.feedItemId);
    ctx.dispatch({
      type: "feed-items",
      items: distinct.reverse(),
    });
  }));
}

function watchUserEntry(ctx: ChatContext) {
  if (!ctx.userId) return;
  const key = userKeys.byId(ctx.userId);
  ctx.readers.push(
    watchKv<[User]>([key], ([entry]) => ctx.state.userEntry = entry),
  );
}

function watchSpaceEntry(ctx: ChatContext) {
  const key = spaceKeys.byId(ctx.spaceId);
  ctx.readers.push(
    watchKv<[Space]>([key], ([entry]) => ctx.state.spaceEntry = entry),
  );
}

function watchSpaceItemEntry(ctx: ChatContext) {
  if (!ctx.spaceItemId) return;
  const key = spaceItemKeys.byId(ctx.spaceItemId);
  ctx.readers.push(watchKv<[SpaceItem]>([key], ([entry]) => {
    ctx.state.spaceItemEntry = entry;
  }));
}

// =====================
// Utils
// =====================

function sanitizeMsgText(text: string) {
  return collapseLineBreaks(text, 2).trim();
}

function collapseLineBreaks(text: string, maxBreaks: number) {
  const regex = new RegExp(`(\\n{${maxBreaks},})`, "g");
  const replacement = "\n".repeat(maxBreaks);
  return text.replace(regex, replacement);
}

function watchKv<T extends unknown[]>(
  keys: Parameters<typeof kv.watch<T>>[0],
  cb: (value: { [K in keyof T]: Deno.KvEntryMaybe<T[K]> }) => void,
) {
  const reader = kv.watch<T>(keys).getReader();
  (async () => {
    while (true) {
      const result = await reader.read();
      if (result.done) break;
      cb(result.value);
    }
  })();
  return reader;
}

// =====================
// Errors
// =====================

class ClientError extends Error {
  constructor() {
    super();
    this.name = "ClientError";
  }
}

class BadInboundDataError extends ClientError {
  constructor() {
    super();
    this.name = "BadInboundDataError";
  }
}

class UserNotFoundError extends ClientError {
  constructor() {
    super();
    this.name = "UserNotFoundError";
  }
}

class SpaceNotFoundError extends ClientError {
  constructor() {
    super();
    this.name = "SpaceNotFoundError";
  }
}
class SpaceItemNotFoundError extends ClientError {
  constructor() {
    super();
    this.name = "SpaceItemNotFoundError";
  }
}

class ChatDisabledError extends ClientError {
  constructor() {
    super();
    this.name = "ChatDisabledError";
  }
}
