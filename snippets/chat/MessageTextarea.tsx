import { CHAT_MESSAGE_CONTRAINTS } from "$chat";
import type { JSX } from "preact";

type Props = JSX.HTMLAttributes<HTMLTextAreaElement>;

export default function MessageTextarea(props: Props) {
  return (
    <textarea
      rows={1}
      required
      {...CHAT_MESSAGE_CONTRAINTS}
      placeholder="Type a message…"
      {...props}
    />
  );
}
