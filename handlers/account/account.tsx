import { asset } from "$server";
import RegForm from "../../snippets/auth/RegForm.tsx";
import LoginPage from "../../snippets/pages/LoginPage.tsx";
import Page from "../../snippets/pages/Page.tsx";
import { listPasskeysByUser } from "../../util/kv/passkeys.ts";
import type { AppContext, Passkey } from "../../util/types.ts";

export default async function passkeysHandler(ctx: AppContext) {
  const user = ctx.state.user;
  const title = "Your account";

  if (!user) {
    return <LoginPage title={title} />;
  }

  const passkeys = await listPasskeysByUser(user.id);

  const head = (
    <>
      <link rel="stylesheet" href={asset("passkeys/passkeys.css")} />
      <script type="module" src={asset("passkeys/passkeys.js")} />
      <script type="module" src={asset("reg.js")} />
    </>
  );

  return (
    <Page title={title} head={head}>
      <h1>{title}</h1>
      <h2>Passkeys</h2>
      <ul class="passkeys-list">
        {passkeys.map((passkey) => (
          <PasskeyItem passkey={passkey} count={passkeys.length} />
        ))}
      </ul>
      <RegForm />
      <footer>
        <p>
          <a href="/">Home</a>
        </p>
      </footer>
    </Page>
  );
}

function PasskeyItem(props: {
  passkey: Passkey;
  count: number;
}, ctx: AppContext) {
  const { passkey, count } = props;
  const { createdAt, lastUsedAt } = passkey;
  const dateFmt = new Intl.DateTimeFormat(ctx.locale, {
    hour: "numeric",
    minute: "numeric",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <li>
      <ButtonRename passkey={passkey} /> —{" "}
      {count > 1 && <ButtonDelete passkey={passkey} />}
      Created {dateFmt.format(createdAt)},{"  "}
      {lastUsedAt ? `last used ${dateFmt.format(lastUsedAt)}` : "never used"}
    </li>
  );
}

function ButtonRename(props: { passkey: Passkey }) {
  return (
    <button
      class="rename-passkey"
      title="Rename passkey"
      data-cred-id={props.passkey.credId}
    >
      {props.passkey.name || "Untitled"}
    </button>
  );
}

function ButtonDelete(props: { passkey: Passkey }) {
  return (
    <form
      method="post"
      action="/account/passkeys/delete"
      class="delete-passkey"
    >
      <input
        type="hidden"
        name="credId"
        value={props.passkey.credId}
      />
      <button>Delete</button>
    </form>
  );
}
