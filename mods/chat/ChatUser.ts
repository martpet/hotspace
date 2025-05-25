import { kvWatch } from "$util";
import type { ChatConnection } from "./ChatConnection.ts";
import type { ChatUserResource } from "./util/types.ts";

export interface ChatUserOptions {
  id: string;
  kv: Deno.Kv;
  kvKey: Deno.KvKey;
}

export class ChatUser {
  id: string;
  kvEntry?: Deno.KvEntryMaybe<ChatUserResource>;
  ready: Promise<unknown>;
  #isSetup = false;
  #kv: Deno.Kv;
  #kvKey: Deno.KvKey;
  #kvEntryReady = Promise.withResolvers<void>();
  #kvReaders: ReadableStreamDefaultReader[] = [];
  #connections = new Set<ChatConnection>();
  static #users = new Map<string, ChatUser>();

  constructor(opt: ChatUserOptions) {
    ChatUser.add(this);
    this.id = opt.id;
    this.#kv = opt.kv;
    this.#kvKey = opt.kvKey;
    this.ready = Promise.all([
      this.#kvEntryReady.promise,
    ]);
  }

  static add(user: ChatUser) {
    this.#users.set(user.id, user);
  }

  static remove(id: string) {
    this.#users.delete(id);
  }

  static get(id: string) {
    return this.#users.get(id);
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
    this.#kvReaders.push(this.#whatchUserEntry());
  }

  async #cleanup() {
    ChatUser.remove(this.id);
    await Promise.all(this.#kvReaders.map((r) => r.cancel()));
  }

  #whatchUserEntry() {
    return kvWatch<[ChatUserResource]>({
      kv: this.#kv,
      kvKeys: [this.#kvKey],
      onEntries: ([entry]) => {
        this.#kvEntryReady.resolve();
        this.kvEntry = entry;
      },
    });
  }
}
