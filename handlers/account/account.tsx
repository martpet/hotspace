import { format } from "@std/fmt/bytes";
import ButtonDeleteAccount from "../../components/ButtonDeleteAccount.tsx";
import LoginPage from "../../components/pages/LoginPage.tsx";
import Page from "../../components/pages/Page.tsx";
import PasskeysList from "../../components/PasskeysList.tsx";
import { getuploadSizeByOwner } from "../../util/kv/filenodes_stats.ts";
import { listPasskeysByUser } from "../../util/kv/passkeys.ts";
import type { AppContext } from "../../util/types.ts";
import { asset } from "../../util/url.ts";

export default async function passkeysHandler(ctx: AppContext) {
  const user = ctx.state.user;
  const title = "Your Account";

  if (!user) {
    return <LoginPage title={title} />;
  }

  const head = (
    <>
      <link rel="stylesheet" href={asset("passkeys/passkeys.css")} />
    </>
  );

  const [passkeys, uploadedSizeEntry] = await Promise.all([
    listPasskeysByUser(user.id),
    getuploadSizeByOwner(user, { consistency: "eventual" }),
  ]);

  const uploadSize = Number(uploadedSizeEntry.value);

  return (
    <Page
      id="account-page"
      title={title}
      head={head}
      header={{ siteNameIsLink: true }}
    >
      <main class="sectioned">
        <h1>{title}</h1>
        <section>
          <h2>Passkeys</h2>
          <PasskeysList passkeys={passkeys} />
        </section>
        <section>
          <h2>Storage size</h2>
          {!!uploadSize && <p>You have uplaoded {format(uploadSize)}.</p>}
          {!uploadSize && <p>You haven't uploaded anything yet.</p>}
        </section>
        <section>
          <h2>Delete account</h2>
          <p>
            Permanently delete your files and chat messages.
          </p>
          <ButtonDeleteAccount />
        </section>
      </main>
    </Page>
  );
}
