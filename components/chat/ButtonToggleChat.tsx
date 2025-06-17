import { type ChatResource } from "$chat";
import { type JSX } from "preact";
import { asset } from "../../util/url.ts";

export interface ButtonToggleChatProps
  extends JSX.HTMLAttributes<HTMLButtonElement> {
  chat: ChatResource;
}

export default function ButtonToggleChat(props: ButtonToggleChatProps) {
  const { chat, ...btnProps } = props;
  let btnClass = "wait-disabled";
  if (btnProps.class) btnClass += ` ${btnProps.class}`;

  return (
    <>
      <script type="module" src={asset("chat/toggle_chat.js")} />
      <button
        id="toggle-chat"
        disabled
        data-inode-id={chat.id}
        {...btnProps}
        class={btnClass}
      >
        <i class="icn-chat-right" />
        {chat.chatEnabled ? "Disable" : "Enable"} Chat
      </button>
    </>
  );
}
