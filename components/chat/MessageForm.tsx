import { CHAT_MESSAGE_CONTRAINTS } from "../../util/constraints.ts";

export function MessageForm() {
  return (
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
  );
}
