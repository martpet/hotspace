import { ROOT_DIR_ID } from "../../util/inodes/consts.ts";
import type { Inode } from "../../util/inodes/types.ts";

interface Props {
  inode: Inode;
}

export function InodeAnchor({ inode }: Props) {
  const isSpace = inode.parentDirId === ROOT_DIR_ID;
  const inodeType = isSpace ? "space" : inode.type;

  let href = `./${inode.name}`;
  let name = inode.name;

  if (inode.type === "file") {
    name = decodeURIComponent(name);
  } else {
    href = href + "/";
  }

  const classes = `inode ${inodeType}`;

  return (
    <a href={href} class={classes}>
      {name}
    </a>
  );
}
