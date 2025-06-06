import { kvWatch } from "$util";
import type { ChatConnection } from "./ChatConnection.ts";
import {
  feedItemsKeys,
  listFeedItemsByChat,
} from "./util/kv/chat_feed_items.ts";
import { listChatSubs } from "./util/kv/chat_subs.ts";
import type { ChatResource, OutboundChatEvent } from "./util/types.ts";

export interface ChatOptions {
  id: string;
  location: string;
  title: string;
  kv: Deno.Kv;
  kvKey: Deno.KvKey;
}

export class Chat {
  id: string;
  location: string;
  title: string;
  lastFeedItemId = "";
  lastSentFeedItemId = "";
  kv: Deno.Kv;
  kvEntry?: Deno.KvEntryMaybe<ChatResource>;
  ready: Promise<unknown>;
  #isSetup = false;
  #hasSubs = false;
  #kvKey: Deno.KvKey;
  #kvEntryReady = Promise.withResolvers<void>();
  #kvReaders: ReadableStreamDefaultReader[] = [];
  #bcChannel?: BroadcastChannel;
  #connections = new Set<ChatConnection>();
  static #chats = new Map<string, Chat>();

  constructor(opt: ChatOptions) {
    Chat.add(this);
    this.id = opt.id;
    this.location = opt.location;
    this.title = opt.title;
    this.kv = opt.kv;
    this.#kvKey = opt.kvKey;
    this.ready = Promise.all([
      this.#kvEntryReady.promise,
    ]);
  }

  static add(chat: Chat) {
    this.#chats.set(chat.id, chat);
  }

  static remove(id: string) {
    this.#chats.delete(id);
  }

  static get(id: string) {
    return this.#chats.get(id);
  }

  addConnection(conn: ChatConnection) {
    this.#connections.add(conn);
    if (!this.#isSetup) this.#setup();
  }

  async removeConnection(conn: ChatConnection) {
    this.#connections.delete(conn);
    if (!this.#connections.size) {
      await this.#cleanup();
    }
  }

  #setup() {
    this.#isSetup = true;
    this.#kvReaders.push(this.#watchChatEntry());
    this.#kvReaders.push(this.#watchLastFeedItemId());
    this.#bcChannel = new BroadcastChannel(this.id);
    this.#bcChannel.onmessage = (event) => this.#handleBcChannelMsg(event);
  }

  async #cleanup() {
    Chat.remove(this.id);
    this.#bcChannel?.close();
    await Promise.all(this.#kvReaders.map((r) => r.cancel()));
  }

  #handleBcChannelMsg(event: MessageEvent) {
    this.sendAll(event.data, { skipBcChannel: true });
  }

  sendAll(
    data: OutboundChatEvent,
    opt: {
      except?: ChatConnection;
      skipBcChannel?: boolean;
    } = {},
  ) {
    for (const conn of this.#connections) {
      if (opt.except === conn) continue;
      conn.sendToUser(data);
    }
    if (!opt.skipBcChannel) {
      this.#bcChannel?.postMessage(data);
    }
  }

  async checkHasSubs() {
    if (this.#hasSubs) return true;
    const chatSubs = await listChatSubs({
      kv: this.kv,
      chatId: this.id,
      listOptions: {
        limit: 1,
        consistency: "eventual",
      },
    });
    this.#hasSubs = chatSubs.length > 0;
    return this.#hasSubs;
  }

  fetchFeedItems(startId: string) {
    return listFeedItemsByChat({
      kv: this.kv,
      chatId: this.id,
      listSelector: {
        start: feedItemsKeys.byChat(this.id, startId),
      },
    });
  }

  async #sendFeedItems() {
    const lastSeenId = this.#getOldestLastSeenFeedItemId();
    if (lastSeenId >= this.lastFeedItemId) return;
    const items = await this.fetchFeedItems(lastSeenId);
    if (!items.length) return;
    for (const conn of this.#connections) {
      const data = conn.sanitizeFeedItems(items);
      if (!data.length) continue;
      conn.sendToUser({ type: "feed", data });
    }
  }

  #getOldestLastSeenFeedItemId() {
    let oldest;
    for (const conn of this.#connections) {
      const id = conn.lastSeenFeedItemId;
      if (!oldest || oldest > id) oldest = id;
    }
    return oldest!;
  }

  #watchChatEntry() {
    return kvWatch<[ChatResource]>({
      kv: this.kv,
      kvKeys: [this.#kvKey],
      onEntries: ([entry]) => {
        this.kvEntry = entry;
        this.#kvEntryReady.resolve();
      },
    });
  }

  #watchLastFeedItemId() {
    const kvKey = feedItemsKeys.lastFeedItemIdByChat(this.id);
    return kvWatch<[string]>({
      kv: this.kv,
      kvKeys: [kvKey],
      onEntries: ([entry]) => {
        if (!entry.value) return;
        this.lastFeedItemId = entry.value;
        this.#sendFeedItems();
      },
    });
  }
}
