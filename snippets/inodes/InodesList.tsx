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
        return (
          <li class={inode.type}>
            <a href={`./${inode.name}/`}>{inode.name}</a>
          </li>
        );
      })}
    </ul>
  );
}
