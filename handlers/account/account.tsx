import { asset } from "$server";
import { format } from "@std/fmt/bytes";
import LoginPage from "../../snippets/pages/LoginPage.tsx";
import Page from "../../snippets/pages/Page.tsx";
import PasskeysList from "../../snippets/PasskeysList.tsx";
import { listPasskeysByUser } from "../../util/kv/passkeys.ts";
import { getUploadSizeByUser } from "../../util/kv/upload_size.ts";
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

  const [passkeys, { value: uploadedSize }] = await Promise.all([
    listPasskeysByUser(user.id),
    getUploadSizeByUser(user, "eventual"),
  ]);

  return (
    <Page title={title} head={head} header={{ siteNameIsLink: true }}>
      <h1>{title}</h1>
      <section>
        <h2>Storage size</h2>
        <p>You have uploaded {format(Number(uploadedSize))}.</p>
      </section>
      <section>
        <h2>Login passkeys</h2>
        <PasskeysList passkeys={passkeys} />
      </section>
    </Page>
  );
}
