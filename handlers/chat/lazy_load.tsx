import { listChatMessages, MESSAGES_PER_FETCH } from "$chat";
import { STATUS_CODE } from "@std/http/status";
import ChatMessages from "../../snippets/chat/ChatMessages.tsx";
import { kv } from "../../util/kv/kv.ts";
import type { AppContext } from "../../util/types.ts";

export default async function chatLazyLoadHandler(ctx: AppContext) {
  const { chatId } = ctx.urlPatternResult.pathname.groups;
  const isAdmin = !!ctx.url.searchParams.get("isAdmin");

  if (!chatId) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  const { messages, nextCursor } = await listChatMessages({
    kv,
    chatId,
    listOptions: {
      limit: MESSAGES_PER_FETCH,
      consistency: "eventual",
      reverse: true,
    },
  });

  messages.reverse();

  return ctx.jsxFragment(
    <ChatMessages
      messages={messages}
      olderMsgsCursor={nextCursor}
      isAdmin={isAdmin}
    />,
  );
}
