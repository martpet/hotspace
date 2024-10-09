import Chat from "../../components/chat/Chat.tsx";
import ToggleChatEnabledButton from "../../components/chat/ToggleChatEnabledButton.tsx";
import HomeLink from "../../components/HomeLink.tsx";
import NotFoundPage from "../../components/pages/NotFoundPage.tsx";
import Page from "../../components/pages/Page.tsx";
import DeleteSpaceButton from "../../components/space/DeleteSpaceButton.tsx";
import type { ChatMessage } from "../../util/chat_types.ts";
import { listChatMessages } from "../../util/db/chat_messages.ts";
import { getSpaceByName } from "../../util/db/spaces.ts";
import type { AppContext } from "../../util/types.ts";

export default async function showSpace(ctx: AppContext) {
  const spaceName = ctx.urlPatternResult.pathname.groups.spaceName!;
  const space = (await getSpaceByName(spaceName)).value;
  const user = ctx.state.user;
  let messages: ChatMessage[] = [];

  if (!space) {
    return <NotFoundPage />;
  }

  if (space.chatEnabled) {
    messages = await listChatMessages(space.id, { consistency: "eventual" });
  }

  const isOwner = space.ownerUsername === user?.username;

  return (
    <Page
      title={space.name}
      head={<meta name="robots" content="noindex" />}
    >
      <h1>{space.name}</h1>
      {isOwner && (
        <menu>
          <ToggleChatEnabledButton space={space} />
          <DeleteSpaceButton space={space} />
        </menu>
      )}
      {space.chatEnabled && (
        <aside>
          <h2>Chat</h2>
          <Chat space={space} messages={messages} />
        </aside>
      )}
      <footer>
        <HomeLink />
      </footer>
    </Page>
  );
}
