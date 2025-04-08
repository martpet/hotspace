import { getPermissions, parsePathname } from "$util";
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

export default async function showDirHandler(ctx: AppContext) {
  const { user } = ctx.state;
  const path = parsePathname(ctx.url.pathname);
  const fragmentId = ctx.url.searchParams.get("fragment") as FragmentId | null;
  const from = ctx.state.from as From | undefined;
  const notFound = () => notFoundHandler(ctx, { header: { breadcrumb: true } });

  const dirNodeEntry = await getDirByPath(path.segments, {
    consistency: fragmentId === "chat" ? "strong" : "eventual",
  });

  const dirNode = dirNodeEntry.value;
  const { canRead, canCreate, canModerate } = getPermissions({
    user,
    resource: dirNode,
  });

  if (!dirNode || !canRead) {
    return notFound();
  }

  const chatSection = (
    <ChatSection
      enabled={dirNode.chatEnabled}
      chatId={dirNode.id}
      chatTitle={dirNode.name}
      canModerate={canModerate}
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

  let canModifySome = false;
  let canViewAclSome = false;
  let canChangeAclSome = false;

  const inodesPermissions = inodes.map((inode) => {
    const per = getPermissions({ user, resource: inode });
    if (per.canModify) canModifySome = true;
    if (per.canViewAcl) canViewAclSome = true;
    if (per.canChangeAcl) canChangeAclSome = true;
    return per;
  });

  const inodesTable = (
    <InodesTable
      inodes={inodes}
      canCreate={canCreate}
      canModifySome={canModifySome}
      canViewAclSome={canViewAclSome}
      inodesPermissions={inodesPermissions}
    />
  );

  if (fragmentId === "inodes") {
    return ctx.jsxFragment(inodesTable);
  }

  const head = (
    <>
      {(canChangeAclSome || canCreate) && (
        <script type="module" src={asset("inodes/acl.js")} />
      )}
      <link rel="stylesheet" href={asset("inodes/inodes.css")} />
      <link rel="stylesheet" href={asset("chat/chat.css")} />
    </>
  );

  const showMenu = canModifySome || canCreate || canModerate;

  const inodesMenu = showMenu && (
    <menu class="menu-bar">
      {(canModifySome || canCreate) && <InodesTableMenu dirId={dirNode.id} />}
      {canCreate && <ButtonUpload dirId={dirNode.id} />}
      {canCreate && <ButtonCreateDir parentDirId={dirNode.id} />}
      {canModerate && <ButtonToggleChat chat={dirNode} />}
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
        {inodesMenu}
      </header>
      <div id="inodes-container">
        {inodesTable}
      </div>
      {chatSection}
    </Page>
  );
}
