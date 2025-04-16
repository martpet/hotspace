import type { AppContext } from "../util/types.ts";

export default function ButtonDeleteAccount(_: unknown, ctx: AppContext) {
  const { user } = ctx.state;
  const js = "btnDelAccount.onclick = () => dialogDelAccount.showModal()";
  const css = "#dialogDelAccount footer button[formmethod] { order: -1 }";

  if (!user) return null;

  const PATTERN_CONFIRM = user.username;

  return (
    <>
      <button id="btnDelAccount">Delete Account</button>

      <dialog id="dialogDelAccount">
        <h1>Delete Your Account</h1>
        <form action="/account/delete" method="post" class="basic-form">
          <p class="alert warning">
            Your account, files and chat messages will be deleted.<br />
            This action cannot be undone.
          </p>
          <label>
            <span>
              To confirm, type your username in the field:
            </span>
            <input
              type="text"
              required
              autofocus
              pattern={PATTERN_CONFIRM}
            />
          </label>
          <footer>
            <button>Delete Account Forever</button>
            <button formmethod="dialog" formnovalidate>Cancel</button>
          </footer>
        </form>
      </dialog>

      {/* Use "command" attr: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#show-modal */}
      <script nonce={ctx.scpNonce} dangerouslySetInnerHTML={{ __html: js }} />
      <style nonce={ctx.scpNonce} dangerouslySetInnerHTML={{ __html: css }} />
    </>
  );
}
