import { ChatConnection, type CheckAdminFn } from "$chat";
import { parsePath } from "$util";
import { STATUS_CODE } from "@std/http";
import { enqueue } from "../../util/kv/enqueue.ts";
import { keys as inodesKeys } from "../../util/kv/inodes.ts";
import { kv } from "../../util/kv/kv.ts";
import { keys as userKvKeys } from "../../util/kv/users.ts";
import type { AppContext, Inode } from "../../util/types.ts";

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

  const checkAdmin: CheckAdminFn = (inode) => {
    return !!user && user.id === (inode as Inode).ownerId;
  };

  const path = parsePath(new URL(chatPageUrl).pathname);

  let chatKvKey;

  if (path.isDir) {
    chatKvKey = inodesKeys.dirsByPath(path.segments);
  } else {
    const parentDirId = ctx.url.searchParams.get("parentDirId");
    if (!parentDirId) return ctx.respond(null, STATUS_CODE.NotFound);
    chatKvKey = inodesKeys.byDir(parentDirId, path.lastSegment);
  }

  const conn = new ChatConnection({
    request: ctx.req,
    chatId,
    chatPageUrl,
    chatTitle,
    chatKvKey,
    userId: user?.id,
    userKvKey: userKvKeys.byId(user?.id!),
    lastSeenFeedItemId,
    kv,
    kvEnqueue: enqueue,
    checkAdmin,
  });

  return conn.response;
}
