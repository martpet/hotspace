import { USERNAME_CONSTRAINTS } from "../../util/input_constraints.ts";
import type { AppContext } from "../../util/types.ts";

export default function RegForm(_props: unknown, ctx: AppContext) {
  const { user } = ctx.state;

  return (
    <>
      <form id="reg-form">
        {!user && (
          <>
            <label>Username:</label>
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
          </>
        )}
        <button>
          {!user ? "Create Account" : "Add Passkey"}
        </button>

        {!user && <p class="tip">A passkey will be created</p>}
      </form>
    </>
  );
}
