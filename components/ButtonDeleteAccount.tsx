import type { AppContext } from "../util/types.ts";
import { asset } from "../util/url.ts";

export default function ButtonDeleteAccount(_: unknown, ctx: AppContext) {
  const { user } = ctx.state;

  if (!user) return null;

  return (
    <>
      <script type="module" src={asset("delete_account.js")} />
      <button
        id="show-delete-account"
        class="wait-disabled"
        disabled
      >
        Delete account
      </button>
    </>
  );
}
