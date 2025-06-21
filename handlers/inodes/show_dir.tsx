import { getPermissions, parsePathname, segmentsToPathname } from "$util";
import ChatSection from "../../components/chat/ChatSection.tsx";
import ButtonCreateDir from "../../components/inodes/ButtonCreateDir.tsx";
import ButtonPageSettings from "../../components/inodes/ButtonPageSettings.tsx";
import ButtonUpload from "../../components/inodes/ButtonUpload.tsx";
import InodesTable, {
  getInodesPermissions,
} from "../../components/inodes/InodesTable.tsx";
import MenuBulkActions from "../../components/inodes/MenuBulkActions.tsx";
import NotFoundPage from "../../components/pages/NotFoundPage.tsx";
import Page from "../../components/pages/Page.tsx";
import { getDirByPath, listInodesByDir } from "../../util/kv/inodes.ts";
import type { AppContext } from "../../util/types.ts";
import { asset } from "../../util/url.ts";
import { FROM_TOGGLE_CHAT } from "../chat/toggle_chat.ts";
import { FROM_DELETE } from "./delete.ts";

const PARTIAL_INODES = "inodes";

export default async function showDirHandler(ctx: AppContext) {
  const { user } = ctx.state;
  const path = parsePathname(ctx.url.pathname);
  const partial = ctx.url.searchParams.get("partial");
  const from = ctx.url.searchParams.get("from");

  const { value: dirNode } = await getDirByPath(path.segments, {
    consistency: from === FROM_TOGGLE_CHAT ? "strong" : "eventual",
  });

  const perm = getPermissions({ user, resource: dirNode });

  if (!dirNode || !perm.canRead) {
    return <NotFoundPage />;
  }

  const canonicalPathname = segmentsToPathname(dirNode.pathSegments, {
    isDir: true,
  });

  if (canonicalPathname !== ctx.url.pathname) {
    return ctx.redirect(canonicalPathname);
  }

  const inodes = await listInodesByDir(dirNode.id, {
    consistency: partial === PARTIAL_INODES || from === FROM_DELETE
      ? "strong"
      : "eventual",
  });

  const inodesPermissions = getInodesPermissions(inodes, ctx.state.user);
  const { canModifySome, canChangeAclSome } = inodesPermissions;

  const inodesTable = (
    <InodesTable
      inodes={inodes}
      canCreate={perm.canCreate}
      inodesPermissions={inodesPermissions}
    />
  );

  if (partial === PARTIAL_INODES) {
    return ctx.respondJsxPartial(inodesTable);
  }

  const head = (
    <>
      <meta name="robots" content="noindex, nofollow" />
      {(canChangeAclSome || perm.canCreate) && (
        <script type="module" src={asset("inodes/acl.js")} />
      )}
      <link rel="stylesheet" href={asset("inodes/inodes.css")} />
    </>
  );

  const showMenu = canModifySome || perm.canCreate || perm.canModify ||
    perm.canModerate;

  const inodesMenu = showMenu && (
    <menu class="menu-bar">
      {(canModifySome || perm.canCreate) && (
        <MenuBulkActions dirId={dirNode.id} />
      )}
      {perm.canCreate && <ButtonUpload dirId={dirNode.id} />}
      {perm.canCreate && <ButtonCreateDir parentDirId={dirNode.id} />}
      {(perm.canModify || perm.canModerate) && (
        <ButtonPageSettings inode={dirNode} perm={perm} />
      )}
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
      <ChatSection
        enabled={dirNode.chatEnabled}
        chatId={dirNode.id}
        chatTitle={dirNode.name}
        perm={perm}
      />
    </Page>
  );
}
