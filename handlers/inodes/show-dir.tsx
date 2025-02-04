import { asset } from "$server";
import Chat from "../../snippets/chat/Chat.tsx";
import ButtonCreateDir from "../../snippets/inodes/ButtonCreateDir.tsx";
import ButtonToggleChat from "../../snippets/inodes/ButtonToggleChat.tsx";
import ButtonUpload from "../../snippets/inodes/ButtonUpload.tsx";
import InodesList from "../../snippets/inodes/InodesList.tsx";
import NotFoundPage from "../../snippets/pages/NotFoundPage.tsx";
import Page from "../../snippets/pages/Page.tsx";
import { getDir, listInodesByDir } from "../../util/kv/inodes.ts";
import type { AppContext } from "../../util/types.ts";
import { parsePath } from "../../util/url.ts";

export default async function showInodeHandler(ctx: AppContext) {
  const { user } = ctx.state;
  const path = parsePath(ctx.url.pathname);
  const dirNode = (await getDir(path.segments, "eventual")).value;

  if (!dirNode) {
    return <NotFoundPage />;
  }

  const fragmentId = ctx.url.searchParams.get("fragment");

  const inodes = await listInodesByDir(dirNode.id, {
    consistency: fragmentId ? "strong" : "eventual",
  });

  const inodesList = <InodesList id="inodes" inodes={inodes} />;

  if (fragmentId === "inodes") {
    return ctx.jsxFragment(inodesList);
  }

  const head = (
    <>
      <meta name="robots" content="noindex, nofollow" />
      {dirNode.chatEnabled && (
        <link rel="stylesheet" href={asset("chat/chat.css")} />
      )}
    </>
  );

  const isOwner = dirNode.ownerId === user?.id;

  return (
    <Page
      id="inodes-page"
      title={dirNode.name}
      head={head}
      header={{ breadcrumb: true }}
    >
      <h1>{dirNode.name}</h1>
      {isOwner && (
        <menu class="inodes-menu">
          <ButtonUpload />
          <ButtonCreateDir />
          <ButtonToggleChat inode={dirNode} />
        </menu>
      )}
      {inodesList}
      {dirNode.chatEnabled && (
        <Chat
          chatId={dirNode.id}
          chatTitle={dirNode.name}
          isAdmin={isOwner}
        />
      )}
    </Page>
  );
}
