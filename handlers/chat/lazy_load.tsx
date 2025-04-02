import { listChatMessages, MESSAGES_PER_FETCH } from "$chat";
import { STATUS_CODE } from "@std/http";
import { getPermissions } from "../../lib/util/file_permissions.ts";
import ChatMessages from "../../snippets/chat/ChatMessages.tsx";
import { getInodeById } from "../../util/kv/inodes.ts";
import { kv } from "../../util/kv/kv.ts";
import type { AppContext } from "../../util/types.ts";

export default async function chatLazyLoadHandler(ctx: AppContext) {
  const { user } = ctx.state;
  const { chatId } = ctx.urlPatternResult.pathname.groups;

  if (!chatId) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  const inode = (await getInodeById(chatId, { consistency: "eventual" })).value;
  const { canRead, canModerate } = getPermissions({ user, resource: inode });

  if (!inode || !canRead) {
    return ctx.respond(null, STATUS_CODE.NotFound);
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
      canModerate={canModerate}
    />,
  );
}
