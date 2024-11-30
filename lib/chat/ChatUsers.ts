import { watchKv } from "$util";
import type { ChatConnection } from "./ChatConnection.ts";
import type { ChatUser } from "./types.ts";

interface ChatUserData {
  kvEntry?: Deno.KvEntryMaybe<ChatUser>;
  kvReader: ReadableStreamDefaultReader;
  connections: Set<ChatConnection>;
}

export class ChatUsers {
  #data = new Map<string, ChatUserData>();

  getKvEntry(userId: string) {
    return this.#data.get(userId)?.kvEntry;
  }

  addConnection(connection: ChatConnection) {
    const userId = connection.userId;
    let userData = this.#data.get(userId!);
    if (userData || !userId) {
      connection.userIsSetup.resolve(undefined);
    }
    if (userId && !userData) {
      userData = {
        connections: new Set(),
        kvReader: this.#watchUserKvEntry({
          userId,
          kv: connection.kv,
          userKvKey: connection.usersKvKeyBuilder(userId),
          resolveKvFetched: connection.userIsSetup.resolve,
        }),
      };
      this.#data.set(userId, userData);
    }
    userData?.connections.add(connection);
  }

  removeConnection(connection: ChatConnection) {
    const userData = this.#data.get(connection.userId!);
    if (!userData) return;
    userData.connections.delete(connection);
    if (!userData.connections.size) {
      this.#data.delete(userData.kvEntry?.value?.id!);
      userData.kvReader.cancel();
    }
  }

  #watchUserKvEntry(options: {
    kv: Deno.Kv;
    userId: string;
    userKvKey: Deno.KvKey;
    resolveKvFetched: PromiseWithResolvers<unknown>["resolve"];
  }) {
    const { kv, userId, userKvKey, resolveKvFetched } = options;
    return watchKv<[ChatUser]>(kv, [userKvKey], ([entry]) => {
      resolveKvFetched(undefined);
      const userData = this.#data.get(userId);
      if (userData) userData.kvEntry = entry;
    });
  }
}

export const chatUsers = new ChatUsers();
