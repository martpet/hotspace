import { asset } from "../../util/url.ts";

interface Props {
  inodeId: string;
  chatEnabled: boolean | undefined;
}

export default function ButtonToggleChat(props: Props) {
  const { inodeId, chatEnabled } = props;

  return (
    <>
      <script type="module" src={asset("chat/toggle.js")} />
      <button
        id="toggle-chat"
        disabled
        class="wait-disabled"
        data-inode-id={inodeId}
      >
        {chatEnabled ? "Disable" : "Enable"} Chat
      </button>
    </>
  );
}
