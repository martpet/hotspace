import {
  type ChatSub,
  deleteChatSub,
  getChatSub,
  keys as chatSubsKvKeys,
  setChatSub,
} from "$chat";
import { METHOD, STATUS_CODE } from "@std/http";
import { kv } from "../util/kv/kv.ts";
import { getSubscriber } from "../util/kv/subscribers.ts";
import type { AppContext } from "../util/types.ts";

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

function isReqDataValid(
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
  const reqData = await ctx.req.json();

  if (!isReqDataValid(reqData)) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }
  const { chatId, subscriberId, isSubscriberInChat } = reqData;
  const subscriberEntry = await getSubscriber(subscriberId);

  if (!subscriberEntry.value) {
    return ctx.respond(null, STATUS_CODE.UnprocessableEntity);
  }
  const chatSub = {
    chatId,
    subscriberId,
    isSubscriberInChat,
  };
  const chatSubKey = chatSubsKvKeys.byChat(chatId, subscriberId);
  const { ok } = await setChatSub(chatSub, kv.atomic())
    .check(subscriberEntry)
    .check({ key: chatSubKey, versionstamp: null })
    .commit();

  if (!ok) {
    return ctx.respond(null, STATUS_CODE.Conflict);
  }
  return ctx.json(chatSub, STATUS_CODE.Created);
}

async function handleDelete(ctx: AppContext) {
  const reqData = await ctx.req.json();

  if (!isReqDataValid(reqData)) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  const chatSubEntry = await getChatSub({
    chatId: reqData.chatId,
    subscriberId: reqData.subscriberId,
  }, kv);

  if (!chatSubEntry.value) {
    return ctx.respond(null, STATUS_CODE.UnprocessableEntity);
  }
  const { ok } = await deleteChatSub(chatSubEntry.value, kv.atomic())
    .check(chatSubEntry)
    .commit();

  if (!ok) {
    return ctx.respond(null, STATUS_CODE.Conflict);
  }
  return ctx.respond(null, STATUS_CODE.NoContent);
}
