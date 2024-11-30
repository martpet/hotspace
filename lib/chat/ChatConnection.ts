import { Chat, type ChatOptions } from "./Chat.ts";
import { chats } from "./Chats.ts";
import { chatUsers } from "./ChatUsers.ts";
import { ChatError } from "./errors.ts";
import { config as handlersConfig } from "./event_handlers/config.ts";
import { getChatSub, setChatSub } from "./kv/chat_subs.ts";
import type {
  ChatFeedItem,
  InboundChatEvent,
  KvEnqueueFn,
  OutboundChatEvent,
  UsersKvKeyBuilder,
} from "./types.ts";

export interface ChatConnectionOptions extends ChatOptions {
  request: Request;
  lastSeenFeedItemId: string | null;
  chatUrl: string;
  pageTitle: string;
  userId: string | undefined;
  usersKvKeyBuilder: UsersKvKeyBuilder;
  kvEnqueueFn: KvEnqueueFn;
}

export class ChatConnection {
  socket: WebSocket;
  response: Response;
  chat: Chat;
  chatId: string;
  chatUrl: string;
  pageTitle: string;
  userId: string | undefined;
  userIsSetup = Promise.withResolvers();
  subscriberId?: string;
  lastSeenFeedItemId: string;
  kv: Deno.Kv;
  ready: Promise<unknown>;
  usersKvKeyBuilder: UsersKvKeyBuilder;
  enqueue: KvEnqueueFn;
  #kvReaders: ReadableStreamDefaultReader[] = [];

  constructor(opt: ChatConnectionOptions) {
    const {
      request,
      userId,
      usersKvKeyBuilder,
      lastSeenFeedItemId,
      chatUrl,
      pageTitle,
      kvEnqueueFn,
      ...chatOpt
    } = opt;
    const { socket, response } = Deno.upgradeWebSocket(request);
    const chat = chats.get(chatOpt.chatId) || new Chat(chatOpt);

    this.socket = socket;
    this.response = response;
    this.chat = chat;
    this.chatUrl = chatUrl;
    this.chatId = chat.chatId;
    this.pageTitle = pageTitle;
    this.userId = userId;
    this.lastSeenFeedItemId = lastSeenFeedItemId || "";
    this.kv = chat.kv;
    this.usersKvKeyBuilder = usersKvKeyBuilder;
    this.enqueue = kvEnqueueFn;
    this.ready = Promise.all([
      chat.ready,
      this.userIsSetup.promise,
    ]);

    socket.onopen = () => {
      chat.addConnection(this);
    };

    socket.onclose = () => {
      chat.removeConnection(this);
      this.#cleanup();
    };

    socket.onmessage = (event) => {
      this.#handleSocketMessage(event);
    };
  }

  get chatEntry() {
    return this.chat.chatEntry;
  }

  get userEntry() {
    return chatUsers.getKvEntry(this.userId!);
  }

  get isAdmin() {
    return this.chat.admins.has(this.userEntry?.value?.username!);
  }

  #cleanup() {
    this.#kvReaders.forEach((r) => r.cancel());
    this.#cleanupSubscriber();
  }

  send(data: OutboundChatEvent) {
    this.socket.send(JSON.stringify(data));
  }

  sendOthers(data: OutboundChatEvent) {
    this.chat.sendAll(data, { except: this });
  }

  async #handleSocketMessage(event: MessageEvent) {
    await this.ready;
    const chatEvent = JSON.parse(event.data) as InboundChatEvent;
    const config = handlersConfig.get(chatEvent.type);
    if (!config) throw new Error(`Missing config for '${chatEvent.type}'`);
    const { handler, options: { queue } = {} } = config;
    let fn = handler;
    if (queue) fn = (...a) => queue.add(() => handler(...a));
    let resp: OutboundChatEvent | null = null;
    try {
      resp = await fn(chatEvent, this);
    } catch (error) {
      if (error instanceof ChatError) {
        resp = { type: "error", data: { name: error.name } };
      } else {
        console.error(error);
      }
    }
    if (resp) this.send(resp);
  }

  sanitizeFeedItems(feedItems: ChatFeedItem[]) {
    const sanitizedItems: ChatFeedItem[] = [];
    const delMsgsIds: string[] = [];
    const username = this.userEntry?.value?.username;
    for (let i = feedItems.length - 1; i >= 0; i--) {
      const item = feedItems[i];
      if (item.id <= this.lastSeenFeedItemId) continue;
      if (delMsgsIds.includes(item.data.id)) continue;
      if (item.type === "deleted-chat-msg") delMsgsIds.push(item.data.id);
      if (item.type === "new-chat-msg" && item.data.username !== username) {
        delete (item.data as { clientMsgId: unknown }).clientMsgId;
      }
      sanitizedItems.unshift(item);
    }
    return sanitizedItems;
  }

  async #cleanupSubscriber() {
    if (!this.subscriberId) return;

    const chatSub = (await getChatSub({
      chatId: this.chatId,
      subscriberId: this.subscriberId,
    }, this.kv)).value;

    if (chatSub) {
      await setChatSub({
        ...chatSub,
        isSubscriberInChat: false,
      }, this.kv.atomic())
        .commit();
    }
  }
}
