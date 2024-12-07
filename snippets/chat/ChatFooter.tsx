import { CHAT_MESSAGE_CONTRAINTS } from "../../lib/chat/consts.ts";
import type { AppContext } from "../../util/types.ts";

interface Props {
  hasUser: boolean;
}
export default function ChatFooter({ hasUser }: Props, ctx: AppContext) {
  const { userAgent } = ctx;
  return (
    <>
      {hasUser && (
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
        type="button"
        title="See new message"
        aria-live="polite"
        hidden
      >
        {userAgent.device.type === "mobile" ? "↓" : "⬇"}
      </button>
    </>
  );
}
