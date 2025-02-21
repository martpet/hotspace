import type { Passkey } from "../util/types.ts";
import { asset } from "../util/url.ts";
import RegForm from "./auth/RegForm.tsx";
import RelativeTime from "./RelativeTime.tsx";

interface Props {
  passkeys: Passkey[];
}

export default function PasskeysList({ passkeys }: Props) {
  return (
    <>
      <script type="module" src={asset("passkeys/passkeys.js")} />
      <script type="module" src={asset("reg.js")} />

      <ul class="passkeys-list">
        {passkeys.map((passkey) => (
          <ListItem passkey={passkey} count={passkeys.length} />
        ))}
      </ul>

      <RegForm />
    </>
  );
}

function ListItem(props: { passkey: Passkey; count: number }) {
  const { passkey, count } = props;
  const { createdAt, lastUsedAt } = passkey;

  return (
    <li>
      <ButtonRename passkey={passkey} /> —{" "}
      {count > 1 && <ButtonDelete passkey={passkey} />}
      created {<RelativeTime date={createdAt} />}, {lastUsedAt
        ? <>last used {<RelativeTime date={lastUsedAt} />}.</>
        : "Never used."}
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
      {props.passkey.name || "untitled"}
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
