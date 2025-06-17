import { JSX } from "preact/jsx-runtime";
import { ROOT_DIR_ID } from "../../util/inodes/consts.ts";
import { getInodeLabel } from "../../util/inodes/helpers.ts";
import type { Inode } from "../../util/inodes/types.ts";
import { asset } from "../../util/url.ts";

interface Props extends JSX.HTMLAttributes<HTMLButtonElement> {
  inode: Inode;
}

export default function ButtonDeleteInode(props: Props) {
  const { inode, ...btnProps } = props;
  const isSpace = inode.parentDirId === ROOT_DIR_ID;
  const inodeLabel = getInodeLabel(inode);

  return (
    <>
      <script type="module" src={asset("inodes/delete.js")} />

      <button
        id="delete-inode-button"
        class="wait-disabled"
        disabled
        data-inode-name={inode.name}
        data-parent-dir-id={inode.parentDirId}
        data-is-dir={inode.type === "dir" ? "1" : null}
        data-is-space={isSpace ? "1" : null}
        {...btnProps}
      >
        <i class="icn-trash" />
        Delete {inodeLabel}
      </button>
    </>
  );
}
