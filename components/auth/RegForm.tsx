import { USERNAME_CONSTRAINTS } from "../../util/constraints.ts";
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
          {!user ? "Create account" : "Add Passkey"}
        </button>
      </form>
    </>
  );
}
