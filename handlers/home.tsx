import { getPermissions } from "$util";
import { MINUTE } from "@std/datetime/constants";
import { HEADER } from "@std/http/unstable-header";
import About from "../components/About.tsx";
import BlankSlate from "../components/BlankSlate.tsx";
import BulkActions from "../components/inodes/BulkActions.tsx";
import ButtonCreateDir from "../components/inodes/ButtonCreateDir.tsx";
import InodesTable from "../components/inodes/InodesTable.tsx";
import Page from "../components/pages/Page.tsx";
import { ROOT_DIR_ID } from "../util/inodes/consts.ts";
import { listRootDirsByOwner } from "../util/kv/inodes.ts";
import { getSettings } from "../util/kv/settings.ts";
import type { AppContext } from "../util/types.ts";
import { asset } from "../util/url.ts";

type FragmentId = "inodes";
type From = "delete";

export default async function homeHandler(ctx: AppContext) {
  const user = ctx.state.user;

  if (!user) {
    ctx.resp.headers.set(
      HEADER.CacheControl,
      `Cache-Control: public, max-age=${MINUTE * 30 / 1000}`,
    );

    const { value: settings } = await getSettings("eventual");

    return (
      <Page>
        <About initialUploadQuota={settings?.initialUploadQuota} />
      </Page>
    );
  }

  ctx.resp.headers.set(HEADER.CacheControl, `Cache-Control: private, no-store`);

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
          title={`Hi, ${user.username}!`}
          subTitle="You don't have any spaces."
        >
          <button class="create-space" data-click="show-create-dir">
            Create Space
          </button>
        </BlankSlate>
      }
    />
  );

  if (fragmentId === "inodes") {
    return ctx.respondJsxFragment(spacesTable);
  }

  const head = (
    <>
      <script type="module" src={asset("inodes/acl.js")} />
      <link rel="stylesheet" href={asset("inodes/inodes.css")} />
    </>
  );

  const inodesMenu = (
    <menu class="menu-bar">
      <BulkActions dirId={ROOT_DIR_ID} isSingleSelect inodeLabel="Space" />
      <ButtonCreateDir parentDirId={ROOT_DIR_ID} />
    </menu>
  );

  return (
    <Page head={head}>
      <header class="inodes-header">
        <h1>Your Spaces</h1>
        {inodesMenu}
      </header>

      <div id="inodes-container">
        {spacesTable}
      </div>
    </Page>
  );
}
