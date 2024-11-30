import { feedItemsKeys, listFeedItemsByChat } from "$chat";
import { watchKv } from "$util";
import type { ChatConnection } from "./ChatConnection.ts";
import { chats } from "./Chats.ts";
import { chatUsers } from "./ChatUsers.ts";
import { listChatSubs } from "./kv/chat_subs.ts";
import type {
  ChatEntryKvWatchCallback,
  ChatResource,
  OutboundChatEvent,
} from "./types.ts";

export interface ChatOptions {
  chatId: string;
  kv: Deno.Kv;
  chatEntryKey: Deno.KvKey;
  chatEntryCb?: ChatEntryKvWatchCallback;
}

export class Chat {
  chatId: string;
  chatEntryKey: Deno.KvKey;
  chatEntry?: Deno.KvEntryMaybe<ChatResource>;
  lastFeedItemId = "";
  admins = new Set<string>();
  kv: Deno.Kv;
  ready: Promise<unknown>;
  #connections = new Set<ChatConnection>();
  #bcChannel?: BroadcastChannel;
  #kvReaders: ReadableStreamDefaultReader[] = [];
  #chatEntryCb?: ChatEntryKvWatchCallback;
  #chatEntryFetched = Promise.withResolvers();
  #hasSubs = false;
  #prepared = false;
  static chats = new Map<string, Chat>();

  constructor(opt: ChatOptions) {
    chats.add(this);
    this.chatId = opt.chatId;
    this.kv = opt.kv;
    this.chatEntryKey = opt.chatEntryKey;
    this.#chatEntryCb = opt.chatEntryCb;
    this.ready = Promise.all([
      this.#chatEntryFetched.promise,
    ]);
  }

  #prepare() {
    this.#prepared = true;
    this.#watchLastFeedItemId();
    this.#watchChatKvEntry();
    this.#bcChannel = new BroadcastChannel(this.chatId);
    this.#bcChannel.onmessage = (ev) => this.#handleBcChannelMsg(ev);
  }

  #destroy() {
    chats.remove(this);
    this.#bcChannel?.close();
    this.#kvReaders.forEach((r) => r.cancel());
  }

  addConnection(connection: ChatConnection) {
    if (!this.#prepared) this.#prepare();
    this.#connections.add(connection);
    chatUsers.addConnection(connection);
    connection.ready.then(() => {
      this.#sendUnseenFeedItems(connection);
    });
  }

  removeConnection(connection: ChatConnection) {
    this.#connections.delete(connection);
    chatUsers.removeConnection(connection);
    if (!this.#connections.size) {
      this.#destroy();
    }
  }

  sendAll(
    data: OutboundChatEvent,
    opt: {
      except?: ChatConnection;
      skipBcChannel?: boolean;
    } = {},
  ) {
    for (const connection of this.#connections) {
      if (opt.except === connection) continue;
      connection.send(data);
    }
    if (!opt.skipBcChannel) {
      this.#bcChannel?.postMessage(data);
    }
  }

  #handleBcChannelMsg(event: MessageEvent) {
    this.sendAll(event.data, { skipBcChannel: true });
  }

  #watchChatKvEntry() {
    this.#kvReaders.push(
      watchKv<[ChatResource]>(this.kv, [this.chatEntryKey], ([entry]) => {
        this.#chatEntryFetched.resolve(undefined);
        this.#chatEntryCb?.({
          chat: this,
          prevEntry: this.chatEntry,
          entry,
        });
        this.chatEntry = entry;
      }),
    );
  }

  #watchLastFeedItemId() {
    const lastFeedItemIdKey = feedItemsKeys.lastFeedItemIdByChat(this.chatId);
    this.#kvReaders.push(
      watchKv<[string]>(this.kv, [lastFeedItemIdKey], async ([entry]) => {
        if (!entry.value) return;
        this.lastFeedItemId = entry.value;
        const startId = this.#oldestLastSeenFeedItemId;
        const result = await this.#fetchFeedItems(startId);
        for (const conn of this.#connections) {
          const items = conn.sanitizeFeedItems(result);
          if (items.length) conn.send({ type: "feed", data: items });
        }
      }),
    );
  }

  #fetchFeedItems(startId: string) {
    return listFeedItemsByChat({
      kv: this.kv,
      chatId: this.chatId,
      listSelector: {
        start: feedItemsKeys.byChat(this.chatId, startId),
      },
    });
  }

  async #sendUnseenFeedItems(connection: ChatConnection) {
    if (this.lastFeedItemId > connection.lastSeenFeedItemId) {
      let items = await this.#fetchFeedItems(connection.lastSeenFeedItemId);
      items = connection.sanitizeFeedItems(items);
      if (items.length) connection.send({ type: "feed", data: items });
    }
  }

  get #oldestLastSeenFeedItemId() {
    let oldest;
    for (const connection of this.#connections) {
      const id = connection.lastSeenFeedItemId;
      if (oldest === undefined || oldest > id) {
        oldest = id;
      }
    }
    return oldest!;
  }

  async checkHasSubs() {
    if (this.#hasSubs) return true;
    const subs = await listChatSubs({
      kv: this.kv,
      chatId: this.chatId,
      listOptions: {
        limit: 1,
        consistency: "eventual",
      },
    });
    this.#hasSubs = subs.length > 0;
    return this.#hasSubs;
  }
}
