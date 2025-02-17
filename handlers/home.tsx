import ButtonCreateDir from "../snippets/inodes/ButtonCreateDir.tsx";
import Spaces from "../snippets/inodes/Spaces.tsx";
import Page from "../snippets/pages/Page.tsx";
import { listRootDirsByOwner } from "../util/kv/inodes.ts";
import type { AppContext } from "../util/types.ts";

export default async function homeHandler(ctx: AppContext) {
  const user = ctx.state.user;

  if (!user) {
    return <Page />;
  }

  const fragmentId = ctx.url.searchParams.get("fragment");

  const dirNodes = await listRootDirsByOwner(user.id, {
    consistency: fragmentId ? "strong" : "eventual",
  });

  const spacesList = <Spaces id="spaces" spaces={dirNodes} />;

  if (fragmentId === "spaces") {
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
