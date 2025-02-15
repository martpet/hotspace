import { asset } from "$server";
import ButtonToggleChat from "../../snippets/chat/ButtonToggleChat.tsx";
import ChatSection from "../../snippets/chat/ChatSection.tsx";
import BatchOperationsButtons from "../../snippets/inodes/BatchOperationsButtons.tsx";
import ButtonCreateDir from "../../snippets/inodes/ButtonCreateDir.tsx";
import ButtonUpload from "../../snippets/inodes/ButtonUpload.tsx";
import InodesTable from "../../snippets/inodes/InodesTable.tsx";
import NotFoundPage from "../../snippets/pages/NotFoundPage.tsx";
import Page from "../../snippets/pages/Page.tsx";
import { getDirNode, listInodesByDir } from "../../util/kv/inodes.ts";
import type { AppContext } from "../../util/types.ts";
import { parsePath } from "../../util/url.ts";

export default async function showInodeHandler(ctx: AppContext) {
  const { user } = ctx.state;
  const path = parsePath(ctx.url.pathname);
  const fragmentId = ctx.url.searchParams.get("fragment");

  const dirNode =
    (await getDirNode(path.segments, fragmentId ? "strong" : "eventual")).value;

  if (!dirNode) {
    return <NotFoundPage header={{ breadcrumb: true }} />;
  }

  const isDirOwner = dirNode.ownerId === user?.id;

  const chatSection = (
    <ChatSection
      enabled={dirNode.chatEnabled}
      chatId={dirNode.id}
      chatTitle={dirNode.name}
      isAdmin={isDirOwner}
    />
  );

  if (fragmentId === "chat") {
    return ctx.jsxFragment(chatSection);
  }

  const inodes = await listInodesByDir(dirNode.id, {
    consistency: fragmentId ? "strong" : "eventual",
  });

  const inodesTable = (
    <InodesTable
      id="inodes"
      inodes={inodes}
      isDirOwner={isDirOwner}
    />
  );

  if (fragmentId === "inodes") {
    return ctx.jsxFragment(inodesTable);
  }

  const head = (
    <>
      <meta name="robots" content="noindex, nofollow" />
      <link rel="stylesheet" href={asset("inodes/inodes.css")} />
    </>
  );

  return (
    <Page
      id="dir-page"
      title={dirNode.name}
      head={head}
      header={{ breadcrumb: true }}
    >
      <header>
        <h1>{dirNode.name}</h1>
        {isDirOwner && (
          <menu class="inodes-menu">
            <ButtonUpload />
            <ButtonCreateDir />
            <ButtonToggleChat chatEnabled={dirNode.chatEnabled} />
            <BatchOperationsButtons />
          </menu>
        )}
      </header>
      <div id="inodes-container">
        {inodesTable}
      </div>
      {chatSection}
    </Page>
  );
}
