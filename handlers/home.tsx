import ButtonCreateDir from "../snippets/inodes/ButtonCreateDir.tsx";
import SpacesList from "../snippets/inodes/SpacesList.tsx";
import LoginPage from "../snippets/pages/LoginPage.tsx";
import Page from "../snippets/pages/Page.tsx";
import { listRootDirsByOwner } from "../util/kv/inodes.ts";
import type { AppContext } from "../util/types.ts";

export default async function homeHandler(ctx: AppContext) {
  const user = ctx.state.user;

  if (!user) {
    return <LoginPage title="HotSpace" />;
  }

  return (
    <Page siteNameIsHeading>
      <h2>Your spaces</h2>
      <SpacesList dirs={await listRootDirsByOwner(user.id)} />
      <ButtonCreateDir isRootDir />
    </Page>
  );
}
