import { Chat } from "./Chat.ts";

export class Chats {
  #chats = new Map<string, Chat>();

  get(chatId: string) {
    return this.#chats.get(chatId);
  }

  add(chat: Chat) {
    this.#chats.set(chat.chatId, chat);
  }

  remove(chat: Chat) {
    this.#chats.delete(chat.chatId);
  }
}

export const chats = new Chats();
