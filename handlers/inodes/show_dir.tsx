import { parsePathname } from "$util";
import ButtonToggleChat from "../../snippets/chat/ButtonToggleChat.tsx";
import ChatSection from "../../snippets/chat/ChatSection.tsx";
import ButtonCreateDir from "../../snippets/inodes/ButtonCreateDir.tsx";
import ButtonUpload from "../../snippets/inodes/ButtonUpload.tsx";
import InodesTable from "../../snippets/inodes/InodesTable.tsx";
import InodesTableMenu from "../../snippets/inodes/InodesTableMenu.tsx";
import Page from "../../snippets/pages/Page.tsx";
import { getDirByPath, listInodesByDir } from "../../util/kv/inodes.ts";
import type { AppContext } from "../../util/types.ts";
import { asset } from "../../util/url.ts";
import notFoundHandler from "../not_found.tsx";

type FragmentId = "inodes" | "chat";
type From = "delete";

export default async function showInodeHandler(ctx: AppContext) {
  const { user } = ctx.state;
  const path = parsePathname(ctx.url.pathname);
  const fragmentId = ctx.url.searchParams.get("fragment") as FragmentId | null;
  const from = ctx.state.from as From | undefined;
  const notFound = () => notFoundHandler(ctx, { header: { breadcrumb: true } });

  const dirNodeEntry = await getDirByPath(path.segments, {
    consistency: fragmentId === "chat" ? "strong" : "eventual",
  });

  const dirNode = dirNodeEntry.value;

  if (!dirNode) {
    return notFound();
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
    consistency: fragmentId === "inodes" || from === "delete"
      ? "strong"
      : "eventual",
  });

  const inodesTable = <InodesTable inodes={inodes} isDirOwner={isDirOwner} />;

  if (fragmentId === "inodes") {
    return ctx.jsxFragment(inodesTable);
  }

  const head = (
    <>
      <link rel="stylesheet" href={asset("inodes/inodes.css")} />
      <link rel="stylesheet" href={asset("chat/chat.css")} />
    </>
  );

  const inodesMenu = (
    <menu class="menu-bar">
      <InodesTableMenu dirId={dirNode.id} />
      <ButtonUpload dirId={dirNode.id} />
      <ButtonCreateDir parentDirId={dirNode.id} />
      <ButtonToggleChat chat={dirNode} />
    </menu>
  );

  return (
    <Page
      id="dir-page"
      title={dirNode.name}
      head={head}
      header={{ breadcrumb: true }}
    >
      <header class="inodes-header">
        <h1>{dirNode.name}</h1>
        {isDirOwner && inodesMenu}
      </header>
      <div id="inodes-container">
        {inodesTable}
      </div>
      {chatSection}
    </Page>
  );
}
