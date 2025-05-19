import { getPermissions, parsePathname, segmentsToPathname } from "$util";
import ButtonToggleChat from "../../components/chat/ButtonToggleChat.tsx";
import ChatSection from "../../components/chat/ChatSection.tsx";
import ButtonCreateDir from "../../components/inodes/ButtonCreateDir.tsx";
import ButtonUpload from "../../components/inodes/ButtonUpload.tsx";
import InodesTable from "../../components/inodes/InodesTable.tsx";
import InodesTableMenu from "../../components/inodes/InodesTableMenu.tsx";
import NotFoundPage from "../../components/pages/NotFoundPage.tsx";
import Page from "../../components/pages/Page.tsx";
import { getDirByPath, listInodesByDir } from "../../util/kv/inodes.ts";
import type { AppContext } from "../../util/types.ts";
import { asset } from "../../util/url.ts";

type FragmentId = "inodes" | "chat";
type From = "delete";

export default async function showDirHandler(ctx: AppContext) {
  const { user } = ctx.state;
  const path = parsePathname(ctx.url.pathname);
  const fragmentId = ctx.url.searchParams.get("fragment") as FragmentId | null;
  const from = ctx.state.from as From | undefined;
  const notFound = () => <NotFoundPage />;

  const { value: dirNode } = await getDirByPath(path.segments, {
    consistency: fragmentId === "chat" ? "strong" : "eventual",
  });

  const perm = getPermissions({ user, resource: dirNode });
  const { canRead, canCreate, canModerate } = perm;

  if (!dirNode || !canRead) {
    return notFound();
  }

  const canonicalPathname = segmentsToPathname(dirNode.pathSegments, {
    isDir: true,
  });

  if (canonicalPathname !== ctx.url.pathname) {
    return ctx.redirect(canonicalPathname);
  }

  const chatSection = (
    <ChatSection
      enabled={dirNode.chatEnabled}
      chatId={dirNode.id}
      chatTitle={dirNode.name}
      perm={perm}
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
      <meta name="robots" content="noindex, nofollow" />
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
