import type { AppContext, Inode } from "../../util/types.ts";
import { getInodeHref } from "../../util/url.ts";

interface Props {
  inodes: Inode[];
}

export default function Inodes(props: Props, ctx: AppContext) {
  const { inodes } = props;
  const { pathname } = ctx.url;

  if (!inodes.length) {
    return null;
  }

  return (
    <ul class="inodes-list">
      {inodes.map((inode) => {
        const href = getInodeHref(inode, pathname);
        return (
          <li class={inode.type}>
            <a href={href}>{inode.name}/</a>
          </li>
        );
      })}
    </ul>
  );
}
