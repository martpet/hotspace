import type { AppContext, DirNode, Inode } from "../../util/types.ts";

interface Props {
  inodes: Inode[];
}

export default function Inodes(props: Props, ctx: AppContext) {
  const { inodes } = props;
  const { pathname } = ctx.url;

  if (!inodes.length) return null;

  return (
    <ul>
      {inodes.map((inode) => (
        <li>
          📁 <a href={inodeHref(inode, pathname)}>{inode.name}</a>
        </li>
      ))}
    </ul>
  );
}

function inodeHref(
  inode: Inode,
  pathname: string,
) {
  let href = inode.name;
  if ((inode as DirNode).type === "dir") href = href + "/";
  if (!pathname.endsWith("/")) href = pathname + "/" + href;
  return href;
}
