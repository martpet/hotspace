import type { Passkey } from "../../util/types.ts";
import Spinner from "../Spinner.tsx";

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  hour: "numeric",
  minute: "numeric",
  day: "numeric",
  month: "short",
  year: "numeric",
});

interface Props {
  passkeys: Passkey[];
}

export default function PasskeysList({ passkeys }: Props) {
  return (
    <>
      <ul id="passkeys">
        {passkeys.map((pass) => (
          <ListItem passkey={pass} count={passkeys.length} />
        ))}
      </ul>

      <template class="spinner-template">
        <Spinner size="xs" />
      </template>
    </>
  );
}

function ListItem(props: {
  passkey: Passkey;
  count: number;
}) {
  const { passkey, count } = props;
  const { createdAt, lastUsedAt } = passkey;
  return (
    <li>
      <RenameButton passkey={passkey} /> — added on {dateFmt.format(createdAt)},
      {lastUsedAt && ` last used on ${dateFmt.format(lastUsedAt)}`}
      {!lastUsedAt && " never used"}
      {count > 1 && <DeleteButton passkey={passkey} />}
    </li>
  );
}

function RenameButton(props: { passkey: Passkey }) {
  return (
    <button
      class="rename-passkey"
      data-cred-id={props.passkey.credId}
      title="Rename passkey"
    >
      {props.passkey.name || "Untitled"}
    </button>
  );
}

function DeleteButton(props: { passkey: Passkey }) {
  return (
    <form
      class="delete-passkey"
      method="post"
      action="/auth/passkey-delete"
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
