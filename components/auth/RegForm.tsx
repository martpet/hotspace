import { USERNAME_CONSTRAINTS } from "../../util/input_constraints.ts";
import type { AppContext } from "../../util/types.ts";

export default function RegForm(_props: unknown, ctx: AppContext) {
  const { user } = ctx.state;

  return (
    <>
      <form id="reg-form">
        {!user && (
          <>
            <strong>No email or password needed</strong>
            <p>
              You’ll sign in with your device — like Face ID, fingerprint, or
              your computer password.
            </p>

            <label for="username">Choose a username:</label>

            <input
              id="username"
              type="text"
              required
              autofocus
              autocomplete="off"
              autocapitalize="off"
              spellcheck={false}
              {...USERNAME_CONSTRAINTS}
            />

            <p class="username-help">
              (It will appear in chat messages and can't be changed later.)
            </p>
          </>
        )}
        <button>
          {!user ? "Create Account" : "Add Passkey"}
        </button>
      </form>
    </>
  );
}
