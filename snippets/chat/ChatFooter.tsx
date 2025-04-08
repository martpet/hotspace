import { CHAT_MESSAGE_CONTRAINTS } from "$chat";
import type { AppContext } from "../../util/types.ts";

export default function ChatFooter(_props: unknown, ctx: AppContext) {
  const { user } = ctx.state;
  const { userAgent } = ctx;

  return (
    <div id="chat-footer">
      {user && (
        <form id="chat-msg-form">
          <fieldset disabled>
            <textarea
              rows={1}
              required
              {...CHAT_MESSAGE_CONTRAINTS}
              placeholder="Type a message…"
            />
            <button hidden>Send</button>
          </fieldset>
        </form>
      )}
      <button
        id="scrollto-unseen-msg-btn"
        title="See new message"
        aria-live="polite"
        hidden
      >
        {userAgent.device.type === "mobile" ? "↓" : "⬇"}
      </button>
    </div>
  );
}
