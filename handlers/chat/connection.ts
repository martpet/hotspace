import { ChatConnection } from "$chat";
import { parsePathname } from "$util";
import { STATUS_CODE } from "@std/http";
import { enqueue } from "../../util/kv/enqueue.ts";
import { keys as inodesKeys } from "../../util/kv/inodes.ts";
import { kv } from "../../util/kv/kv.ts";
import { keys as userKvKeys } from "../../util/kv/users.ts";
import type { AppContext } from "../../util/types.ts";

export default function chatConnectionHandler(ctx: AppContext) {
  const { user } = ctx.state;
  const { chatId } = ctx.urlPatternResult.pathname.groups;
  const chatTitle = ctx.url.searchParams.get("title");
  const chatPageUrl = ctx.url.searchParams.get("location");
  const lastSeenFeedItemId = ctx.url.searchParams.get("lastSeenFeedItemId");

  if (!chatId || !chatTitle || !chatPageUrl) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  if (ctx.req.headers.get("upgrade") !== "websocket") {
    return ctx.respond(null, STATUS_CODE.UpgradeRequired);
  }

  const pathname = new URL(chatPageUrl).pathname;
  const path = parsePathname(pathname);

  if (path.isRoot) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  const conn = new ChatConnection({
    request: ctx.req,
    chatId,
    chatPageUrl,
    chatTitle,
    chatKvKey: inodesKeys.byId(chatId),
    userId: user?.id,
    userKvKey: userKvKeys.byId(user?.id!),
    lastSeenFeedItemId,
    kv,
    kvEnqueue: enqueue,
  });

  return conn.response;
}
