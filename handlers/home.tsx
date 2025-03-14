import ButtonCreateDir from "../snippets/inodes/ButtonCreateDir.tsx";
import UserRootDirs from "../snippets/inodes/UserRootDirs.tsx";
import Page from "../snippets/pages/Page.tsx";
import { ROOT_DIR_ID } from "../util/inodes/consts.ts";
import { listRootDirsByOwner } from "../util/kv/inodes.ts";
import type { AppContext } from "../util/types.ts";
import { asset } from "../util/url.ts";

type FragmentId = "spaces";
type From = "delete";

export default async function homeHandler(ctx: AppContext) {
  const user = ctx.state.user;

  if (!user) {
    return <Page />;
  }

  const fragmentId = ctx.url.searchParams.get("fragment") as FragmentId | null;
  const from = ctx.state.from as From | undefined;

  const dirNodes = await listRootDirsByOwner(user.id, {
    consistency: fragmentId === "spaces" || from === "delete"
      ? "strong"
      : "eventual",
  });

  const userSpacesList = <UserRootDirs dirNodes={dirNodes} />;

  if (fragmentId === "spaces") {
    return ctx.jsxFragment(userSpacesList);
  }

  const head = <link rel="stylesheet" href={asset("inodes/inodes.css")} />;

  return (
    <Page head={head}>
      <h1>Your spaces</h1>
      {userSpacesList}
      <ButtonCreateDir parentDirId={ROOT_DIR_ID} />
    </Page>
  );
}
