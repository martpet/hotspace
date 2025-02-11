import { format as formatBytes } from "@std/fmt/bytes";
import { decodeTime } from "@std/ulid";
import { type JSX } from "preact";
import { getRelativeTime } from "../../lib/util/time.ts";
import type { AppContext, Inode } from "../../util/types.ts";

interface Props extends JSX.HTMLAttributes<HTMLTableElement> {
  inodes: Inode[];
  isDirOwner: boolean;
}

export default function InodesTable(props: Props, ctx: AppContext) {
  const { inodes, isDirOwner, ...tableProps } = props;
  let classes = `inodes-table`;
  if (tableProps.class) classes += ` ${tableProps.class}`;

  return (
    <table {...tableProps} class={classes}>
      {inodes.length > 0 && (
        <>
          <thead>
            <tr>
              <th class="name">Name</th>
              <th class="size">Size</th>
              <th class="created">Creation date</th>
              {isDirOwner && (
                <th class="chbox">
                  <input type="checkbox" autocomplete="off" />
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {inodes.sort(sortInodes).map((inode) => (
              <tr>
                <td class={`name ${inode.type}`}>
                  <InodeAnchor inode={inode} />
                </td>
                <td class="size">
                  {inode.type === "file" ? formatBytes(inode.fileSize) : ""}
                </td>
                <td class="created">
                  {getRelativeTime(
                    new Date(decodeTime(inode.id)),
                    ctx.locale,
                  )}
                </td>
                {isDirOwner && (
                  <td class="chbox">
                    <input type="checkbox" autocomplete="off" />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </>
      )}
    </table>
  );
}

function InodeAnchor(props: { inode: Inode }) {
  const { inode } = props;
  let href = `./${inode.name}`;
  let name = inode.name;

  if (inode.type === "file") {
    name = decodeURIComponent(name);
  } else {
    href = href + "/";
  }
  return <a href={href}>{name}</a>;
}

function sortInodes(a: Inode, b: Inode) {
  if (a.type === "dir" && b.type !== "dir") return -1;
  if (a.type !== "dir" && b.type === "dir") return 1;
  const aName = a.name.toLowerCase();
  const bName = b.name.toLocaleLowerCase();
  if (aName > bName) return 1;
  if (aName < bName) return -1;
  return 0;
}
