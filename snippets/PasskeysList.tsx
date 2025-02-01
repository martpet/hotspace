import { asset } from "$server";
import type { AppContext, Passkey } from "../util/types.ts";
import RegForm from "./auth/RegForm.tsx";

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
          <ListItem
            passkey={passkey}
            count={passkeys.length}
          />
        ))}
      </ul>
      <RegForm />
    </>
  );
}

function ListItem(
  props: { passkey: Passkey; count: number },
  ctx: AppContext,
) {
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
      Created {dateFmt.format(createdAt)}.{"  "}
      {lastUsedAt ? `Last used ${dateFmt.format(lastUsedAt)}` : "Never used"}
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
