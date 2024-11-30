import { USERNAME_CONSTRAINTS } from "../../util/constraints.ts";

interface Props {
  isNewAccount?: boolean;
}

export default function CreateCredentialForm({ isNewAccount }: Props) {
  return (
    <>
      <form id="create-credential">
        {isNewAccount && (
          <>
            <label for="username">Username:</label>
            <input
              id="username"
              type="text"
              required
              autocomplete="off"
              autocapitalize="off"
              spellCheck={false}
              {...USERNAME_CONSTRAINTS}
            />
          </>
        )}
        <button>
          {isNewAccount ? "Register" : "Create Passkey"}
        </button>
      </form>
      <p role="alert" class="error" />
    </>
  );
}
