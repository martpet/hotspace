import { USERNAME_CONSTRAINTS } from "../../util/constraints.ts";
import ButtonSpinner from "../ButtonSpinner.tsx";

interface Props {
  isNewAccount?: boolean;
}

export default function CreateCredentialForm({ isNewAccount }: Props) {
  return (
    <form id="create-credential">
      {isNewAccount && (
        <>
          <label for="username">Username:</label>
          <input
            id="username"
            type="text"
            {...USERNAME_CONSTRAINTS}
            required
            autocomplete="off"
            autocapitalize="off"
            spellCheck={false}
          />
        </>
      )}
      <ButtonSpinner>
        {isNewAccount ? "Create Account" : "Create New Passkey"}
      </ButtonSpinner>
      <p class="alert error" role="alert" hidden></p>
    </form>
  );
}
