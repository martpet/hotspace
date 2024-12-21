import ButtonCreateDir from "../snippets/inodes/ButtonCreateDir.tsx";
import SpacesList from "../snippets/inodes/SpacesList.tsx";
import Page from "../snippets/pages/Page.tsx";
import { listRootDirsByOwner } from "../util/kv/inodes.ts";
import type { AppContext, DirNode } from "../util/types.ts";

export default async function homeHandler(ctx: AppContext) {
  const user = ctx.state.user;

  return (
    <Page siteNameIsHeading>
      {user && <UserHome spaces={await listRootDirsByOwner(user.id)} />}
    </Page>
  );
}

function UserHome(props: { spaces: DirNode[] }) {
  return (
    <>
      <h2>Your spaces</h2>
      <SpacesList dirs={props.spaces} />
      <ButtonCreateDir isRootDir />
    </>
  );
}
