import { type ChatEntryKvWatchCallback } from "$chat";
import { STATUS_CODE } from "@std/http";
import { AppChatConnection } from "../../util/chat.ts";
import { keys as spaceKeys } from "../../util/kv/spaces.ts";
import type { AppContext, Space } from "../../util/types.ts";

export default function spaceChatHandler(ctx: AppContext) {
  const { spaceId } = ctx.urlPatternResult.pathname.groups;
  const urlParams = new URLSearchParams(ctx.url.search);
  const chatUrl = urlParams.get("chatUrl");
  const pageTitle = urlParams.get("pageTitle");
  const lastSeenFeedItemId = urlParams.get("lastSeenFeedItemId");

  if (!spaceId || !chatUrl || !pageTitle) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  if (ctx.req.headers.get("upgrade") !== "websocket") {
    return ctx.respond(null, STATUS_CODE.UpgradeRequired);
  }

  const { response } = new AppChatConnection({
    request: ctx.req,
    userId: ctx.state.user?.id,
    chatId: spaceId,
    chatEntryKey: spaceKeys.byId(spaceId),
    chatEntryCb,
    lastSeenFeedItemId,
    chatUrl,
    pageTitle,
  });

  return response;
}

function chatEntryCb(result: Parameters<ChatEntryKvWatchCallback>[0]) {
  const { prevEntry, entry, chat } = result;
  if (prevEntry?.value) {
    chat.admins.delete((prevEntry.value as Space).ownerUsername);
  }
  if (entry.value) {
    chat.admins.add((entry.value as Space).ownerUsername);
  }
}
