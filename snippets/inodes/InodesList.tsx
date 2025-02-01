import type { Inode } from "../../util/types.ts";

interface Props {
  inodes: Inode[];
}

export default function InodesList(props: Props) {
  const { inodes } = props;

  if (!inodes.length) {
    return null;
  }

  return (
    <ul class="inodes-list">
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
