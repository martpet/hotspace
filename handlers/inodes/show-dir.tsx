import ButtonToggleChat from "../../snippets/chat/ButtonToggleChat.tsx";
import ChatSection from "../../snippets/chat/ChatSection.tsx";
import ButtonCreateDir from "../../snippets/inodes/ButtonCreateDir.tsx";
import ButtonUpload from "../../snippets/inodes/ButtonUpload.tsx";
import InodesTable from "../../snippets/inodes/InodesTable.tsx";
import NotFoundPage from "../../snippets/pages/NotFoundPage.tsx";
import Page from "../../snippets/pages/Page.tsx";
import { getDir, listInodesByDir } from "../../util/kv/inodes.ts";
import type { AppContext } from "../../util/types.ts";
import { parsePathname } from "../../util/url.ts";

export default async function showInodeHandler(ctx: AppContext) {
  const { user } = ctx.state;
  const path = parsePathname(ctx.url.pathname);
  const dirNode = (await getDir(path.segments, "eventual")).value;
  if (!dirNode) return <NotFoundPage />;

  const fragmentId = ctx.url.searchParams.get("fragment");
  const isDirOwner = dirNode.ownerId === user?.id;
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

  return (
    <Page
      id="inodes-page"
      title={dirNode.name}
      head={<meta name="robots" content="noindex, nofollow" />}
      header={{ breadcrumb: true }}
    >
      <h1>{dirNode.name}</h1>
      {isDirOwner && (
        <menu class="inodes-menu">
          <ButtonUpload />
          <ButtonCreateDir />
          <ButtonToggleChat chatEnabled={dirNode.chatEnabled} />
        </menu>
      )}
      {inodesTable}
      {chatSection}
    </Page>
  );
}
