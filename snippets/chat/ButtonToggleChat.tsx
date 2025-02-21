import { asset } from "../../util/url.ts";

interface Props {
  chatEnabled: boolean | undefined;
}

export default function ButtonToggleChat(props: Props) {
  const { chatEnabled } = props;

  return (
    <>
      <script type="module" src={asset("chat/toggle.js")} />
      <button
        id="toggle-chat"
        disabled
        class="wait-disabled"
      >
        {chatEnabled ? "Disable" : "Enable"} Chat
      </button>
    </>
  );
}
