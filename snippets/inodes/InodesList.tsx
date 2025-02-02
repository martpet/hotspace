import { type JSX } from "preact";
import type { Inode } from "../../util/types.ts";

interface Props extends JSX.HTMLAttributes<HTMLUListElement> {
  inodes: Inode[];
}

export default function InodesList({ inodes, ...ulProps }: Props) {
  if (!inodes.length) return null;

  let classes = `inodes-list`;
  if (ulProps.class) classes += ` ${ulProps.class}`;

  return (
    <ul class={classes}>
      {inodes.map((inode) => {
        let href = `./${inode.name}`;
        let name = inode.name;

        if (inode.type === "file") {
          name = decodeURIComponent(name);
        } else {
          href = href + "/";
          name = name + "/";
        }

        return (
          <li class={inode.type}>
            <a href={href}>{name}</a>
          </li>
        );
      })}
    </ul>
  );
}
