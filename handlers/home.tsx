import ButtonCreateDir from "../snippets/inodes/ButtonCreateDir.tsx";
import SpacesList from "../snippets/inodes/SpacesList.tsx";
import Page from "../snippets/pages/Page.tsx";
import { listRootDirsByOwner } from "../util/kv/inodes.ts";
import type { AppContext } from "../util/types.ts";

export default async function homeHandler(ctx: AppContext) {
  const user = ctx.state.user;
  if (!user) return <Page />;

  const spacesListOnly = ctx.url.searchParams.get("spaces");
  const rootDirs = await listRootDirsByOwner(user.id, {
    consistency: spacesListOnly ? "strong" : "eventual",
  });

  const spacesList = (
    <SpacesList
      id="spaces"
      dirs={rootDirs}
    />
  );

  if (spacesListOnly) {
    return ctx.jsxFragment(spacesList);
  }

  return (
    <Page>
      <h1>Your spaces</h1>
      {spacesList}
      <ButtonCreateDir isRoot />
    </Page>
  );
}
