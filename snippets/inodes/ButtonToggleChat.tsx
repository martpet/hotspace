import type { AppContext, Inode } from "../../util/types.ts";

interface Props {
  inode: Inode;
}

export default function ButtonToggleChat({ inode }: Props, ctx: AppContext) {
  const { chatEnabled } = inode;

  return (
    <form method="post" action="/inodes/toggle_chat">
      <input type="hidden" name="pathname" value={ctx.url.pathname} />
      <button>{chatEnabled ? "Disable" : "Enable"} Chat</button>
    </form>
  );
}
