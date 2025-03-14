import { getInodeLabel } from "../../util/inodes/helpers.ts";
import type { Inode } from "../../util/types.ts";
import ButtonToggleChat from "../chat/ButtonToggleChat.tsx";
import PopMenu from "../PopMenu.tsx";
import ButtonDeleteInode from "./ButtonDeleteInode.tsx";

interface Props {
  inode: Inode;
}

export function ButtonManage({ inode }: Props) {
  const inodeLabel = getInodeLabel(inode);

  return (
    <PopMenu id="manage-menu" btnLabel={`Manage ${inodeLabel}`}>
      <ButtonToggleChat
        chat={inode}
        skipHidePopoverId="manage-menu"
      />
      <ButtonDeleteInode inode={inode}>
        Delete {inodeLabel}
      </ButtonDeleteInode>
    </PopMenu>
  );
}
