import { listChatMessages, MESSAGES_PER_FETCH } from "$chat";
import { STATUS_CODE } from "@std/http";
import Chat from "../../snippets/chat/Chat.tsx";
import { kv } from "../../util/kv/kv.ts";
import { getSpaceById } from "../../util/kv/spaces.ts";
import type { AppContext } from "../../util/types.ts";

export default async function chatHtmlHandler(ctx: AppContext) {
  const spaceId = ctx.urlPatternResult.pathname.groups.spaceId!;
  const space = (await getSpaceById(spaceId)).value;

  if (!space) {
    return ctx.respond(null, STATUS_CODE.NotFound);
  }

  const { messages, nextCursor } = await listChatMessages({
    kv,
    chatId: space.id,
    listOptions: {
      limit: MESSAGES_PER_FETCH,
      consistency: "eventual",
      reverse: true,
    },
  });

  messages.reverse();

  ctx.respOpt.skipDosctype = true;

  return (
    <Chat
      space={space}
      messages={messages}
      olderMsgsCursor={nextCursor}
    />
  );
}
