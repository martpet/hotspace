import { MINUTE } from "@std/datetime/constants";
import { HEADER } from "@std/http/unstable-header";
import About from "../components/About.tsx";
import BlankSlate from "../components/BlankSlate.tsx";
import ButtonCreateDir from "../components/inodes/ButtonCreateDir.tsx";
import InodesTable from "../components/inodes/InodesTable.tsx";
import TableActions from "../components/inodes/TableActions.tsx";
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
    const { value: settings } = await getSettings("eventual");
    const { displayInitialUploadQuota, initialUploadQuota } = settings || {};

    ctx.resp.headers.set(
      HEADER.CacheControl,
      `Cache-Control: public, max-age=${MINUTE * 30 / 1000}`,
    );

    return (
      <Page header={{ siteNameIsHeading: true }}>
        <About
          initialUploadQuota={displayInitialUploadQuota && initialUploadQuota}
          noName
        />
      </Page>
    );
  }

  const fragmentId = ctx.url.searchParams.get("fragment") as FragmentId | null;
  const from = ctx.state.from as From | undefined;

  const inodes = await listRootDirsByOwner(user.id, {
    consistency: fragmentId === "inodes" || from === "delete"
      ? "strong"
      : "eventual",
  });

  const spacesTable = (
    <InodesTable
      inodes={inodes}
      isMultiSelect={false}
      skipIcons
      skipCols={["size", "kind"]}
      canCreate
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
      <TableActions dirId={ROOT_DIR_ID} isSingleSelect inodeLabel="Space" />
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
