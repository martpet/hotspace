import CreateCredentialForm from "../components/auth/CreateCredentialForm.tsx";
import LoginButton from "../components/auth/LoginButton.tsx";
import LogoutButton from "../components/auth/LogoutButton.tsx";
import Page from "../components/pages/Page.tsx";
import CreateSpaceButton from "../components/space/CreateSpaceButton.tsx";
import SpacesList from "../components/space/SpacesList.tsx";
import { listSpacesByOwner } from "../util/db/spaces.ts";
import type { AppContext } from "../util/types.ts";

export default async function home(ctx: AppContext) {
  const user = ctx.state.user;

  if (!user) {
    return (
      <Page>
        <h1>Hotspace</h1>
        <h2>Create an account</h2>
        <CreateCredentialForm isNewAccount />
        <h2>Sign In</h2>
        <LoginButton>Sign In</LoginButton>
      </Page>
    );
  }

  const spaces = await listSpacesByOwner(user.username, { reverse: true });

  return (
    <Page>
      <h1>Hotspace</h1>
      <p>Hello, {user.username}.</p>
      <LogoutButton />
      <h2>Your Spaces</h2>
      <SpacesList spaces={spaces} />
      <CreateSpaceButton />
    </Page>
  );
}
