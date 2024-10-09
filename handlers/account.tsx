import HomeLink from "../components/HomeLink.tsx";
import CreateCredentialForm from "../components/auth/CreateCredentialForm.tsx";
import PasskeysList from "../components/auth/PasskeysList.tsx";
import Page from "../components/pages/Page.tsx";
import { listPasskeysByUser } from "../util/db/passkeys.ts";
import type { AppContext } from "../util/types.ts";
import { asset } from "../util/url.ts";

export default async function account(ctx: AppContext) {
  const user = ctx.state.user;

  if (!user) {
    return ctx.redirect("/");
  }

  const passkeys = await listPasskeysByUser(user.id);

  const head = <script type="module" src={asset("account.mjs")} />;

  return (
    <Page title="Your account" head={head}>
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
