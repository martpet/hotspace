import { asset } from "$server";
import { STATUS_CODE } from "@std/http";
import Chat from "../../snippets/chat/Chat.tsx";
import ButtonCreateDir from "../../snippets/inodes/ButtonCreateDir.tsx";
import ButtonToggleChat from "../../snippets/inodes/ButtonToggleChat.tsx";
import ButtonUpload from "../../snippets/inodes/ButtonUpload.tsx";
import InodesList from "../../snippets/inodes/InodesList.tsx";
import NotFoundPage from "../../snippets/pages/NotFoundPage.tsx";
import Page from "../../snippets/pages/Page.tsx";
import { getDirByPath, listInodesByDir } from "../../util/kv/inodes.ts";
import type { AppContext } from "../../util/types.ts";
import { getPathParts } from "../../util/url.ts";

export default async function showInodeHandler(ctx: AppContext) {
  const { user } = ctx.state;
  const { pathname } = ctx.url;
  const { isRootDir, pathParts } = getPathParts(pathname);

  if (isRootDir && !pathname.endsWith("/")) {
    ctx.redirect(ctx.req.url + "/", STATUS_CODE.PermanentRedirect);
  }

  const dirNode = (await getDirByPath(pathParts)).value;

  if (!dirNode) {
    return <NotFoundPage />;
  }

  const isOwner = dirNode.ownerId === user?.id;
  const inodes = await listInodesByDir(dirNode.id);

  const head = (
    <>
      <meta name="robots" content="noindex, nofollow" />
      {dirNode.chatEnabled && (
        <link rel="stylesheet" href={asset("chat/chat.css")} />
      )}
    </>
  );

  return (
    <Page
      title={dirNode.name}
      head={head}
      header={{ breadcrumb: true }}
      id="inodes-page"
    >
      <h1>{dirNode.name}</h1>
      {isOwner && (
        <menu class="inodes-menu">
          <ButtonUpload />
          <ButtonCreateDir />
          <ButtonToggleChat inode={dirNode} />
        </menu>
      )}
      <InodesList inodes={inodes} />
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
