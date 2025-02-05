import { asset } from "$server";

interface Props {
  chatEnabled: boolean | undefined;
}

export default function ButtonToggleChat(props: Props) {
  const { chatEnabled } = props;

  return (
    <>
      <script type="module" src={asset("chat/toggle_chat.js")} />
      <button
        id="toggle-chat"
        type="button"
        disabled
        class="wait-disabled"
      >
        {chatEnabled ? "Disable" : "Enable"} Chat
      </button>
    </>
  );
}
