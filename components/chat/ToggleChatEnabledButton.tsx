import type { Space } from "../../util/types.ts";

interface Props {
  space: Space;
}

export default function ToggleChatEnabledButton({ space }: Props) {
  return (
    <form method="post" action="/chat/toggle-enabled">
      <input type="hidden" name="spaceName" value={space.name} />
      <button>{space.chatEnabled ? "Disable" : "Enable"} Chat</button>
    </form>
  );
}
