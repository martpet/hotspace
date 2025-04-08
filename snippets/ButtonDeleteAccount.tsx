import type { AppContext } from "../util/types.ts";

export default function ButtonDeleteAccount(_: unknown, ctx: AppContext) {
  const js = "btnDelAccount.onclick = () => dialogDelAccount.showModal()";
  const css = "#dialogDelAccount footer button[formmethod] { order: -1 }";

  const PATTERN_CONFIRM = "delete account";

  return (
    <>
      <button id="btnDelAccount">Delete Account</button>

      <dialog id="dialogDelAccount">
        <h1>Delete Your Account</h1>
        <form action="/account/delete" method="post" class="basic-form">
          <p class="alert warning">
            You will lose your files and chat messages.<br />
            This action cannot be undone.
          </p>
          <label>
            <span>
              To confirm, type{" "}
              <em>
                <strong>{PATTERN_CONFIRM}</strong>
              </em>{" "}
              in the field:
            </span>
            <input
              type="text"
              required
              autofocus
              pattern={PATTERN_CONFIRM}
            />
          </label>
          <footer>
            <button>Delete Forever</button>
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
