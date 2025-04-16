import { getPermissions } from "$util";
import BlankSlate from "../snippets/BlankSlate.tsx";
import ButtonCreateDir from "../snippets/inodes/ButtonCreateDir.tsx";
import InodesTable from "../snippets/inodes/InodesTable.tsx";
import InodesTableMenu from "../snippets/inodes/InodesTableMenu.tsx";
import Page from "../snippets/pages/Page.tsx";
import { ROOT_DIR_ID } from "../util/inodes/consts.ts";
import { listRootDirsByOwner } from "../util/kv/inodes.ts";
import type { AppContext } from "../util/types.ts";
import { asset } from "../util/url.ts";

type FragmentId = "inodes";
type From = "delete";

export default async function homeHandler(ctx: AppContext) {
  const user = ctx.state.user;

  if (!user) {
    return <Page />;
  }

  const fragmentId = ctx.url.searchParams.get("fragment") as FragmentId | null;
  const from = ctx.state.from as From | undefined;

  const dirNodes = await listRootDirsByOwner(user.id, {
    consistency: fragmentId === "inodes" || from === "delete"
      ? "strong"
      : "eventual",
  });

  const inodesPermissions = dirNodes.map((inode) =>
    getPermissions({ user, resource: inode })
  );

  const spacesTable = (
    <InodesTable
      inodes={dirNodes}
      isMultiSelect={false}
      skipIcons
      skipCols={["size", "type"]}
      canCreate
      canModifySome
      canViewAclSome
      inodesPermissions={inodesPermissions}
      blankSlate={
        <BlankSlate
          title="No spaces"
          subTitle="You haven't created any spaces yet."
        />
      }
    />
  );

  if (fragmentId === "inodes") {
    return ctx.jsxFragment(spacesTable);
  }

  const head = (
    <>
      <script type="module" src={asset("inodes/acl.js")} />
      <link rel="stylesheet" href={asset("inodes/inodes.css")} />
    </>
  );

  const inodesMenu = (
    <menu class="menu-bar">
      <InodesTableMenu dirId={ROOT_DIR_ID} isSingleSelect inodeLabel="Space" />
      <ButtonCreateDir parentDirId={ROOT_DIR_ID} />
    </menu>
  );

  return (
    <Page head={head}>
      <header class="inodes-header">
        <h1>Your spaces</h1>
        {inodesMenu}
      </header>

      <div id="inodes-container">
        {spacesTable}
      </div>
    </Page>
  );
}
