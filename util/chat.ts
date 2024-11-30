import { ChatConnection, type ChatConnectionOptions } from "$chat";
import { WEEK } from "@std/datetime";
import { enqueue } from "./kv/enqueue.ts";
import { kv } from "./kv/kv.ts";
import { keys as userKvKeys } from "./kv/users.ts";

export const CHAT_SUB_WITHOUT_PUSH_SUB_EXPIRES = WEEK * 2;

type AppChatConnectionOptions = Omit<
  ChatConnectionOptions,
  | "kv"
  | "usersKvKeyBuilder"
  | "kvEnqueueFn"
>;

export class AppChatConnection extends ChatConnection {
  constructor(options: AppChatConnectionOptions) {
    super({
      kv,
      usersKvKeyBuilder: userKvKeys.byId,
      kvEnqueueFn: enqueue,
      ...options,
    });
  }
}
