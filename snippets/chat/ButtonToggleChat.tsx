import { type JSX } from "preact";
import { asset } from "../../util/url.ts";

export interface ButtonToggleChatProps
  extends JSX.HTMLAttributes<HTMLButtonElement> {
  inodeId: string;
  chatEnabled: boolean | undefined;
  skipHidePopoverId?: string;
}

export default function ButtonToggleChat(props: ButtonToggleChatProps) {
  const { inodeId, chatEnabled, skipHidePopoverId, ...btnProps } = props;
  let btnClass = "wait-disabled";
  if (btnProps.class) btnClass += ` ${btnProps.class}`;

  return (
    <>
      <script type="module" src={asset("chat/toggle.js")} />
      <button
        id="toggle-chat"
        disabled
        data-inode-id={inodeId}
        data-hide-popover-id={skipHidePopoverId}
        {...btnProps}
        class={btnClass}
      >
        {chatEnabled ? "Disable" : "Enable"} Chat
      </button>
    </>
  );
}
