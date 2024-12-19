import ButtonCreateDir from "../snippets/inodes/ButtonCreateDir.tsx";
import UserRootDirs from "../snippets/inodes/UserRootDirs.tsx";
import Page from "../snippets/pages/Page.tsx";
import { listRootDirsByOwner } from "../util/kv/inodes.ts";
import type { AppContext, DirNode } from "../util/types.ts";

export default async function homeHandler(ctx: AppContext) {
  const user = ctx.state.user;
  let rootDirs: DirNode[] = [];

  if (user) {
    rootDirs = await listRootDirsByOwner(user.id, { reverse: true });
  }

  return (
    <Page siteNameIsHeading>
      {user && (
        <>
          <h2>Your spaces</h2>
          <ButtonCreateDir isRootDir />
          <UserRootDirs dirs={rootDirs} />
          <h2>Account</h2>
          <a href="/account/passkeys">Passkeys</a>
        </>
      )}
    </Page>
  );
}
