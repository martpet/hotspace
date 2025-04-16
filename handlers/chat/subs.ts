import {
  type ChatSub,
  deleteChatSub,
  getChatSub,
  keys as chatSubsKvKeys,
  setChatSub,
} from "$chat";
import { getPermissions } from "$util";
import { STATUS_CODE } from "@std/http";
import { METHOD } from "@std/http/unstable-method";
import type { Inode } from "../../util/inodes/types.ts";
import { keys as inodesKeys } from "../../util/kv/inodes.ts";
import { kv } from "../../util/kv/kv.ts";
import { keys as pushSubscribersKeys } from "../../util/kv/push_subscribers.ts";
import type { AppContext, PushSubscriber } from "../../util/types.ts";

export default function chatSubsHandler(ctx: AppContext) {
  const { method } = ctx.req;
  if (method === METHOD.Post) {
    return handleCreate(ctx);
  } else if (method === METHOD.Delete) {
    return handleDelete(ctx);
  } else {
    return ctx.respond(null, STATUS_CODE.MethodNotAllowed);
  }
}

function isValidReqData(
  data: unknown,
): data is Pick<ChatSub, "chatId" | "subscriberId" | "isSubscriberInChat"> {
  const { chatId, subscriberId, isSubscriberInChat } = data as Partial<ChatSub>;
  return typeof data === "object" &&
    typeof chatId === "string" &&
    typeof subscriberId === "string" &&
    (typeof isSubscriberInChat === "boolean" ||
      typeof isSubscriberInChat === "undefined");
}

async function handleCreate(ctx: AppContext) {
  const { user } = ctx.state;
  const reqData = await ctx.req.json();

  if (!isValidReqData(reqData)) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  const { chatId, subscriberId, isSubscriberInChat } = reqData;

  const [subscriberEntry, inodeEntry] = await kv.getMany<
    [PushSubscriber, Inode]
  >([
    pushSubscribersKeys.byId(subscriberId),
    inodesKeys.byId(chatId),
  ]);

  const inode = inodeEntry.value;
  const { canRead } = getPermissions({ user, resource: inode });

  if (!inode || !canRead) {
    return ctx.respond(null, STATUS_CODE.NotFound);
  }

  if (!subscriberEntry.value) {
    return ctx.respond(null, STATUS_CODE.UnprocessableEntity);
  }

  const chatSub = {
    chatId,
    subscriberId,
    isSubscriberInChat,
  };

  const nullSubCheck = {
    key: chatSubsKvKeys.byChat(chatId, subscriberId),
    versionstamp: null,
  };

  const atomic = kv.atomic();
  atomic.check(subscriberEntry, nullSubCheck);
  setChatSub(chatSub, atomic);
  const commit = await atomic.commit();

  if (!commit.ok) {
    return ctx.respond(null, STATUS_CODE.Conflict);
  }
  return ctx.json(chatSub, STATUS_CODE.Created);
}

async function handleDelete(ctx: AppContext) {
  const reqData = await ctx.req.json();

  if (!isValidReqData(reqData)) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  const chatSubEntry = await getChatSub({
    chatId: reqData.chatId,
    subscriberId: reqData.subscriberId,
  }, kv);

  if (!chatSubEntry.value) {
    return ctx.respond(null, STATUS_CODE.UnprocessableEntity);
  }
  const commit = await deleteChatSub(chatSubEntry.value, kv.atomic())
    .check(chatSubEntry)
    .commit();

  if (!commit.ok) {
    return ctx.respond(null, STATUS_CODE.Conflict);
  }
  return ctx.respond(null, STATUS_CODE.NoContent);
}
