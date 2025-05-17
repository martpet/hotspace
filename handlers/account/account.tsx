import ButtonDeleteAccount from "../../components/ButtonDeleteAccount.tsx";
import LoginPage from "../../components/pages/LoginPage.tsx";
import Page from "../../components/pages/Page.tsx";
import PasskeysList from "../../components/PasskeysList.tsx";
import UploadCreditMeter from "../../components/UploadCreditMeter.tsx";
import { listPasskeysByUser } from "../../util/kv/passkeys.ts";
import { getTotalUploadedBytesByUser } from "../../util/kv/uploads_stats.ts";
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

  const [passkeys, totalUploaded] = await Promise.all([
    listPasskeysByUser(user.id),
    getTotalUploadedBytesByUser(user, { consistency: "eventual" }),
  ]);

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
          <h2>Upload Quota</h2>
          <UploadCreditMeter
            credit={user.uploadCredit}
            totalUploaded={totalUploaded}
          />
        </section>
        <section>
          <h2>Passkeys</h2>
          <PasskeysList passkeys={passkeys} />
        </section>
        <section>
          <h2>Delete Account</h2>
          <p>
            Permanently delete your account, files and chat messages.
          </p>
          <ButtonDeleteAccount />
        </section>
      </main>
    </Page>
  );
}
