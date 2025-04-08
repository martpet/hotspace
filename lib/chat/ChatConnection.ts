import { getPermissions } from "../util/file_permissions.ts";
import { Chat } from "./Chat.ts";
import { ChatUser } from "./ChatUser.ts";
import { config as handlersConfig } from "./event_handlers/config.ts";
import { ChatError } from "./util/errors.ts";
import { getChatSub, setChatSub } from "./util/kv/chat_subs.ts";
import type {
  ChatFeedItem,
  InboundChatEvent,
  KvEnqueueFn,
  OutboundChatEvent,
} from "./util/types.ts";

interface ChatConnectionOptions {
  request: Request;
  chatId: string;
  chatPageUrl: string;
  chatTitle: string;
  chatKvKey: Deno.KvKey;
  userId: string | undefined;
  userKvKey: Deno.KvKey;
  lastSeenFeedItemId: string | null;
  kv: Deno.Kv;
  kvEnqueue: KvEnqueueFn;
}

export class ChatConnection {
  chat: Chat;
  chatUser: ChatUser | undefined;
  socket: WebSocket;
  response: Response;
  lastSeenFeedItemId: string;
  subscriberId?: string;
  ready: Promise<unknown>;
  kv: Deno.Kv;
  kvEnqueue: KvEnqueueFn;

  constructor(opt: ChatConnectionOptions) {
    const { socket, response } = Deno.upgradeWebSocket(opt.request);

    this.chat = Chat.get(opt.chatId) || new Chat({
      id: opt.chatId,
      location: opt.chatPageUrl,
      title: opt.chatTitle,
      kvKey: opt.chatKvKey,
      kv: opt.kv,
    });

    if (opt.userId) {
      this.chatUser = ChatUser.get(opt.userId) || new ChatUser({
        id: opt.userId,
        kv: opt.kv,
        kvKey: opt.userKvKey,
      });
    }

    this.socket = socket;
    this.response = response;
    this.lastSeenFeedItemId = opt.lastSeenFeedItemId || "";
    this.kv = opt.kv;
    this.kvEnqueue = opt.kvEnqueue;

    this.ready = Promise.all([
      this.chat.ready,
      this.chatUser?.ready,
    ]);

    socket.onopen = async () => {
      this.chat.addConnection(this);
      this.chatUser?.addConnection(this);
      await this.ready;
      this.send({ type: "chat-ready" });
      this.#sendUnseenFeedItems();
    };

    socket.onclose = () => {
      this.chat.removeConnection(this);
      this.chatUser?.removeConnection(this);
      this.#setSubscriberOffline();
    };

    socket.onmessage = (event) => {
      this.#handleSocketMsgEvent(event);
    };
  }

  send(data: OutboundChatEvent) {
    this.socket.send(JSON.stringify(data));
  }

  sendOthers(data: OutboundChatEvent) {
    this.chat.sendAll(data, { except: this });
  }

  get permissions() {
    return getPermissions({
      user: this.chatUser?.kvEntry?.value,
      resource: this.chat.kvEntry?.value,
    });
  }

  async #sendUnseenFeedItems() {
    await this.ready;
    const { canRead } = this.permissions;
    const isChatEnabled = this.chat.kvEntry?.value?.chatEnabled;
    if (!isChatEnabled || !canRead) return;
    const lastSeenId = this.lastSeenFeedItemId;
    if (lastSeenId >= this.chat.lastFeedItemId) return;
    const items = await this.chat.fetchFeedItems(lastSeenId);
    const data = this.sanitizeFeedItems(items);
    if (!data.length) return;
    this.send({ type: "feed", data });
  }

  sanitizeFeedItems(items: ChatFeedItem[]) {
    const username = this.chatUser?.kvEntry?.value?.username;
    const delMsgsIds: string[] = [];
    const sanitized = [];
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      if (item.id <= this.lastSeenFeedItemId) continue;
      if (delMsgsIds.includes(item.data.id)) continue;
      if (item.type === "deleted-chat-msg") delMsgsIds.push(item.data.id);
      if (item.type === "new-chat-msg" && username !== item.data.username) {
        delete (item.data as { clientMsgId: unknown }).clientMsgId;
      }
      sanitized.unshift(item);
    }
    return sanitized;
  }

  async #setSubscriberOffline() {
    if (!this.subscriberId) return;
    const { kv } = this.chat;
    const chatSubEntry = await getChatSub({
      chatId: this.chat.id,
      subscriberId: this.subscriberId,
    }, kv);
    if (chatSubEntry.value) {
      const newChatSub = { ...chatSubEntry.value, isSubscriberInChat: false };
      await setChatSub(newChatSub, kv.atomic()).commit();
    }
  }

  async #handleSocketMsgEvent(event: MessageEvent) {
    await this.ready;
    const chatEvent = JSON.parse(event.data) as InboundChatEvent;
    const handlerConf = handlersConfig.get(chatEvent.type);
    if (!handlerConf) {
      throw new Error(`Missing handler config for '${chatEvent.type}'`);
    }
    let handler = handlerConf.handler;
    const queue = handlerConf.options?.queue;
    if (queue) {
      handler = (...args) => queue.add(() => handlerConf.handler(...args));
    }
    let resp: OutboundChatEvent | null = null;
    try {
      resp = await handler(chatEvent, this);
    } catch (error) {
      if (error instanceof ChatError) {
        resp = { type: "error", data: { name: error.name } };
      } else {
        console.error(error);
      }
    }
    if (resp) this.send(resp);
  }
}
