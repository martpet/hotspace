import type { Space } from "../../util/types.ts";

interface Props {
  space: Space;
}

export default function ButtonToggleChat({ space }: Props) {
  return (
    <form method="post" action="/chat/toggle-disabled">
      <input type="hidden" name="spaceName" value={space.name} />
      <button>{space.chatDisabled ? "Enable" : "Disable"} Chat</button>
    </form>
  );
}
