import { asset } from "$server";
import ButtonToggleChat from "../../snippets/chat/ButtonToggleChat.tsx";
import Chat from "../../snippets/chat/Chat.tsx";
import HomeLink from "../../snippets/HomeLink.tsx";
import NotFoundPage from "../../snippets/pages/NotFoundPage.tsx";
import Page from "../../snippets/pages/Page.tsx";
import ButtonDeleteSpace from "../../snippets/space/ButtonDeleteSpace.tsx";
import { getSpaceByName } from "../../util/kv/spaces.ts";
import type { AppContext } from "../../util/types.ts";

export default async function showSpaceHandler(ctx: AppContext) {
  const spaceName = ctx.urlPatternResult.pathname.groups.spaceName!;
  const space = (await getSpaceByName(spaceName)).value;
  const user = ctx.state.user;

  if (!space) {
    return <NotFoundPage />;
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
          <Chat space={space} lazyLoad />
        </aside>
      )}
      <footer>
        <HomeLink />
      </footer>
    </Page>
  );
}
