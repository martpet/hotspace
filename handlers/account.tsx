import { asset } from "$server";
import HomeLink from "../snippets/HomeLink.tsx";
import CreateCredentialForm from "../snippets/auth/CreateCredentialForm.tsx";
import PasskeysList from "../snippets/auth/PasskeysList.tsx";
import Page from "../snippets/pages/Page.tsx";
import { listPasskeysByUser } from "../util/kv/passkeys.ts";
import type { AppContext } from "../util/types.ts";

export default async function accountHandler(ctx: AppContext) {
  const user = ctx.state.user;

  if (!user) {
    return ctx.redirect("/");
  }

  const passkeys = await listPasskeysByUser(user.id);

  return (
    <Page title="Your account">
      <script type="module" src={asset("account.js")} />
      <header>
        <h1>Your Account</h1>
      </header>
      <section>
        <h2>Passkeys</h2>
        <PasskeysList passkeys={passkeys} />
        <CreateCredentialForm />
      </section>
      <footer>
        <HomeLink />
      </footer>
    </Page>
  );
}
