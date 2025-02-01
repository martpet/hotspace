import { ChatConnection, type CheckAdminFn } from "$chat";
import { STATUS_CODE } from "@std/http";
import { enqueue } from "../../util/kv/enqueue.ts";
import { keys as inodesKeys } from "../../util/kv/inodes.ts";
import { kv } from "../../util/kv/kv.ts";
import { keys as userKvKeys } from "../../util/kv/users.ts";
import type { AppContext, Inode } from "../../util/types.ts";
import { getPathSegments } from "../../util/url.ts";

export default function chatConnectionHandler(ctx: AppContext) {
  const searchParams = new URLSearchParams(ctx.url.search);
  const { user } = ctx.state;
  const { chatId } = ctx.urlPatternResult.pathname.groups;
  const chatTitle = searchParams.get("title");
  const chatPageUrl = searchParams.get("location");
  const lastSeenFeedItemId = searchParams.get("lastSeenFeedItemId");

  if (!chatId || !chatTitle || !chatPageUrl) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  if (ctx.req.headers.get("upgrade") !== "websocket") {
    return ctx.respond(null, STATUS_CODE.UpgradeRequired);
  }

  const checkAdmin: CheckAdminFn = (inode) => {
    return !!user && user.id === (inode as Inode).ownerId;
  };

  const seg = getPathSegments(new URL(chatPageUrl).pathname);

  const conn = new ChatConnection({
    request: ctx.req,
    chatId,
    chatPageUrl,
    chatTitle,
    chatKvKey: inodesKeys.dirsByPath(seg.pathSegments),
    userId: user?.id,
    userKvKey: userKvKeys.byId(user?.id!),
    lastSeenFeedItemId,
    kv,
    kvEnqueue: enqueue,
    checkAdmin,
  });

  return conn.response;
}
