import type { Inode } from "../../util/inodes/types.ts";

interface Props {
  inode: Inode;
}

export default function ButtonToggleChat({ inode }: Props) {
  return (
    <form method="post" action="/chat/toggle">
      <button name="inodeId" value={inode.id}>
        <i class="icn-chat-fill" />
        {inode.chatEnabled ? "Disable" : "Enable"} chat
      </button>
    </form>
  );
}
