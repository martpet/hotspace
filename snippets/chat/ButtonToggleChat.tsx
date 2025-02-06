interface Props {
  chatEnabled: boolean | undefined;
}

// Uses /static/inodes/owner_common.js

export default function ButtonToggleChat(props: Props) {
  const { chatEnabled } = props;

  return (
    <button
      id="toggle-chat"
      disabled
      class="wait-disabled"
    >
      {chatEnabled ? "Disable" : "Enable"} Chat
    </button>
  );
}
