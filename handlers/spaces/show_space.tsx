import { type ChatMessage, listChatMessages, MESSAGES_PER_FETCH } from "$chat";
import { asset } from "$server";
import ButtonToggleChat from "../../snippets/chat/ButtonToggleChat.tsx";
import Chat from "../../snippets/chat/Chat.tsx";
import HomeLink from "../../snippets/HomeLink.tsx";
import NotFoundPage from "../../snippets/pages/NotFoundPage.tsx";
import Page from "../../snippets/pages/Page.tsx";
import ButtonDeleteSpace from "../../snippets/space/ButtonDeleteSpace.tsx";
import { kv } from "../../util/kv/kv.ts";
import { getSpaceByName } from "../../util/kv/spaces.ts";
import type { AppContext } from "../../util/types.ts";

export default async function showSpaceHandler(ctx: AppContext) {
  const spaceName = ctx.urlPatternResult.pathname.groups.spaceName!;
  const space = (await getSpaceByName(spaceName)).value;
  const user = ctx.state.user;
  let messages: ChatMessage[] = [];
  let olderMsgsCursor = null;

  if (!space) {
    return <NotFoundPage />;
  }

  if (!space.chatDisabled) {
    ({ messages, nextCursor: olderMsgsCursor } = await listChatMessages({
      kv,
      chatId: space.id,
      listOptions: {
        limit: MESSAGES_PER_FETCH,
        consistency: "eventual",
        reverse: true,
      },
    }));
    messages.reverse();
  }

  const isAdmin = space.ownerUsername === user?.username;

  const head = (
    <>
      <meta name="robots" content="noindex" />
      {!space.chatDisabled && (
        <link rel="stylesheet" href={asset("chat/chat.css")} />
      )}
    </>
  );

  return (
    <Page title={space.name} head={head}>
      <h1>{space.name}</h1>
      {isAdmin && (
        <menu>
          <li>
            <ButtonToggleChat space={space} />
          </li>
          <li>
            <ButtonDeleteSpace space={space} />
          </li>
        </menu>
      )}
      {!space.chatDisabled && (
        <aside>
          <h2>Chat</h2>
          <Chat
            space={space}
            messages={messages}
            olderMsgsCursor={olderMsgsCursor}
          />
        </aside>
      )}
      <footer>
        <HomeLink />
      </footer>
    </Page>
  );
}
