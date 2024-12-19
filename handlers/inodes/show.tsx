import { asset } from "$server";
import { STATUS_CODE } from "@std/http";
import Chat from "../../snippets/chat/Chat.tsx";
import ButtonCreateDir from "../../snippets/inodes/ButtonCreateDir.tsx";
import ButtonToggleChat from "../../snippets/inodes/ButtonToggleChat.tsx";
import Inodes from "../../snippets/inodes/Inodes.tsx";
import NotFoundPage from "../../snippets/pages/NotFoundPage.tsx";
import Page from "../../snippets/pages/Page.tsx";
import { getDirByPath, listInodesByDir } from "../../util/kv/inodes.ts";
import type { AppContext } from "../../util/types.ts";
import { getDirPathInfo } from "../../util/url.ts";

export default async function showInodeHandler(ctx: AppContext) {
  const { user } = ctx.state;
  const { pathname } = ctx.url;
  const { isRootDir, dirPathParts } = getDirPathInfo(pathname);

  if (isRootDir && pathname.endsWith("/")) {
    const urlWithourTrailSlash = ctx.req.url.slice(0, -1);
    return ctx.redirect(urlWithourTrailSlash, STATUS_CODE.PermanentRedirect);
  }

  const dir = (await getDirByPath(dirPathParts)).value;

  if (!dir) {
    return <NotFoundPage />;
  }

  const isOwner = dir.ownerId === user?.id;
  const inodes = await listInodesByDir(dir.id);

  const head = (
    <>
      <meta name="robots" content="noindex, nofollow" />
      {dir.chatEnabled && (
        <link rel="stylesheet" href={asset("chat/chat.css")} />
      )}
    </>
  );

  return (
    <Page title={dir.name} head={head}>
      <h1>{dir.name}</h1>
      {isOwner && (
        <menu>
          <ButtonCreateDir />
          <ButtonToggleChat inode={dir} />
        </menu>
      )}
      <Inodes inodes={inodes} />
      {dir.chatEnabled && (
        <section>
          <h2>Chat</h2>
          <Chat
            chatId={dir.id}
            chatTitle={dir.name}
            isAdmin={isOwner}
          />
        </section>
      )}
    </Page>
  );
}
