import type { Inode } from "../../util/inodes/types.ts";

interface Props {
  inode: Inode;
  skipIcons?: boolean;
}

export function InodeAnchor({ inode, skipIcons }: Props) {
  let href = `./${inode.name}`;
  let name = inode.name;

  if (inode.type === "file") {
    name = decodeURIComponent(name);
  } else {
    href = href + "/";
  }

  const classes = skipIcons ? "" : `inode ${inode.type}`;

  return (
    <a href={href} class={classes}>
      {name}
    </a>
  );
}
