import ButtonLogin from "../snippets/auth/ButtonLogin.tsx";
import ButtonLogout from "../snippets/auth/ButtonLogout.tsx";
import CreateCredentialForm from "../snippets/auth/CreateCredentialForm.tsx";
import Page from "../snippets/pages/Page.tsx";
import SpacesList from "../snippets/space/SpacesList.tsx";
import { listSpacesByOwner } from "../util/kv/spaces.ts";
import type { AppContext } from "../util/types.ts";

export default async function homeHandler(ctx: AppContext) {
  const user = ctx.state.user;

  if (!user) {
    return (
      <Page>
        <h1>Hot space</h1>
        <h2>Create an account</h2>
        <CreateCredentialForm isNewAccount />
        <h2>Login</h2>
        <ButtonLogin />
      </Page>
    );
  }

  const spaces = await listSpacesByOwner(user.username, { reverse: true });

  return (
    <Page>
      <h1>Hot space</h1>
      <p>Hello, {user.username}.</p>
      <ButtonLogout />
      <h2>Your Spaces</h2>
      <SpacesList spaces={spaces} />
    </Page>
  );
}
