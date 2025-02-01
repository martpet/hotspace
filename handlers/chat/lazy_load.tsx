import { listChatMessages, MESSAGES_PER_FETCH } from "$chat";
import { STATUS_CODE } from "@std/http";
import ChatMessages from "../../snippets/chat/ChatMessages.tsx";
import { getDirByPath } from "../../util/kv/inodes.ts";
import { kv } from "../../util/kv/kv.ts";
import type { AppContext } from "../../util/types.ts";
import { getPathSegments } from "../../util/url.ts";

export default async function chatLazyLoadHandler(ctx: AppContext) {
  const referer = ctx.req.headers.get("referer");

  if (!referer) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  const seg = getPathSegments(new URL(referer).pathname);
  const dir = (await getDirByPath(seg.pathSegments)).value;

  if (!dir) {
    return ctx.respond(null, STATUS_CODE.NotFound);
  }

  const { messages, nextCursor } = await listChatMessages({
    kv,
    chatId: dir.id,
    listOptions: {
      limit: MESSAGES_PER_FETCH,
      consistency: "eventual",
      reverse: true,
    },
  });

  messages.reverse();

  return ctx.jsxPartial(
    <ChatMessages
      messages={messages}
      olderMsgsCursor={nextCursor}
      isAdmin={dir.ownerId === ctx.state.user?.id}
    />,
  );
}
