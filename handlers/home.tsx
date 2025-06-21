import { MINUTE } from "@std/datetime/constants";
import { HEADER } from "@std/http/unstable-header";
import About from "../components/About.tsx";
import BlankSlate from "../components/BlankSlate.tsx";
import ButtonCreateDir from "../components/inodes/ButtonCreateDir.tsx";
import InodesTable from "../components/inodes/InodesTable.tsx";
import MenuBulkActions from "../components/inodes/MenuBulkActions.tsx";
import Page from "../components/pages/Page.tsx";
import { ROOT_DIR_ID } from "../util/inodes/consts.ts";
import { listRootDirsByOwner } from "../util/kv/inodes.ts";
import type { AppContext } from "../util/types.ts";
import { asset } from "../util/url.ts";
import { FROM_DELETE } from "./inodes/delete.ts";

const PARTIAL_INODES = "inodes";

export default function homeHandler(ctx: AppContext) {
  if (ctx.state.user) return handleUserHome(ctx);

  ctx.resp.headers.set(
    HEADER.CacheControl,
    `Cache-Control: public, max-age=${MINUTE * 30 / 1000}`,
  );

  return (
    <Page>
      <About noName />
    </Page>
  );
}

async function handleUserHome(ctx: AppContext) {
  const user = ctx.state.user!;
  const partial = ctx.url.searchParams.get("partial");
  const from = ctx.url.searchParams.get("from");

  const inodes = await listRootDirsByOwner(user.id, {
    consistency: partial === PARTIAL_INODES || from === FROM_DELETE
      ? "strong"
      : "eventual",
  });

  const inodesTable = (
    <InodesTable
      inodes={inodes}
      isMultiSelect={false}
      skipCols={["size", "kind"]}
      canCreate
      blankSlate={
        <BlankSlate
          title={`Hi, ${user.username}!`}
          subTitle="You don't have any spaces."
        >
          <button class="create-space" data-click="show-create-dir">
            Create space
          </button>
        </BlankSlate>
      }
    />
  );

  if (partial === PARTIAL_INODES) {
    return ctx.respondJsxPartial(inodesTable);
  }

  const head = (
    <>
      <script type="module" src={asset("inodes/acl.js")} />
      <link rel="stylesheet" href={asset("inodes/inodes.css")} />
    </>
  );

  const inodesMenu = (
    <menu class="menu-bar">
      <MenuBulkActions dirId={ROOT_DIR_ID} isSingleSelect inodeLabel="Space" />
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
        {inodesTable}
      </div>
    </Page>
  );
}
