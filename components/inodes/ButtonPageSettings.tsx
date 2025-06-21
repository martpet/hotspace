import { type ResourcePermissions } from "$util";
import type { Inode } from "../../util/inodes/types.ts";
import PopMenu from "../PopMenu.tsx";
import ButtonDeleteInode, { DialogDeleteInode } from "./ButtonDeleteInode.tsx";
import ButtonToggleChat from "./ButtonToggleChat.tsx";

interface Props {
  inode: Inode;
  perm: ResourcePermissions;
}

export default function ButtonPageSettings({ inode, perm }: Props) {
  return (
    <>
      <PopMenu
        btnContent={
          <>
            <i class="icn-gear" />
            <span>Settings</span>
          </>
        }
        menuId="inode-settings-menu"
      >
        {perm.canModerate && <ButtonToggleChat inode={inode} />}
        {perm.canModify && <ButtonDeleteInode />}
      </PopMenu>
      <DialogDeleteInode inode={inode} />
    </>
  );
}
