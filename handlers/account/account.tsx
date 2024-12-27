import { asset } from "$server";
import LoginPage from "../../snippets/pages/LoginPage.tsx";
import Page from "../../snippets/pages/Page.tsx";
import Passkeys from "../../snippets/Passkeys.tsx";
import { listPasskeysByUser } from "../../util/kv/passkeys.ts";
import type { AppContext } from "../../util/types.ts";

export default async function passkeysHandler(ctx: AppContext) {
  const user = ctx.state.user;
  const title = "Your account";

  if (!user) {
    return <LoginPage title={title} />;
  }

  const head = (
    <>
      <link rel="stylesheet" href={asset("passkeys/passkeys.css")} />
    </>
  );

  const passkeys = await listPasskeysByUser(user.id);

  return (
    <Page title={title} head={head} header={{ breadcrumb: true }}>
      <section>
        <h1>{title}</h1>
        <Passkeys passkeys={passkeys} />
      </section>
    </Page>
  );
}
