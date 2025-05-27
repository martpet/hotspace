import { USERNAME_CONSTRAINTS } from "../../util/input_constraints.ts";
import type { AppContext } from "../../util/types.ts";

export default function RegForm(_props: unknown, ctx: AppContext) {
  const { user } = ctx.state;

  return (
    <>
      <form id="reg-form">
        {!user && (
          <>
            <label for="username">Choose a username:</label>
            <input
              id="reg-form-username"
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
        <button id="reg-form-submit" class="wait-disabled" disabled>
          {!user ? "Create Account" : "Add Passkey"}
        </button>

        <p id="reg-form-error" class="alert error" hidden></p>
      </form>
    </>
  );
}
