import { format as formatBytes } from "@std/fmt/bytes";
import type { Inode } from "../../util/types.ts";
import RelativeTime from "../RelativeTime.tsx";

interface Props {
  inodes: Inode[];
  isDirOwner: boolean;
}

export default function InodesTable(props: Props) {
  const { inodes, isDirOwner } = props;

  return (
    <div id="inodes">
      {inodes.length === 0 && isDirOwner && (
        <div class="inodes-blank-slate">
          <strong>No items</strong>
          <p>You don't have any items in this folder.</p>
        </div>
      )}

      <table class="inodes-table">
        {inodes.length > 0 && (
          <>
            <thead>
              <tr>
                {isDirOwner && (
                  <th class="chbox">
                    <label>
                      <Checkbox />
                    </label>
                  </th>
                )}
                <th class="name">Name</th>
                <th class="type">Type</th>
                <th class="date">Created</th>
                <th class="size">Size</th>
              </tr>
            </thead>
            <tbody>
              {inodes.sort(sortInodes).map((inode) => (
                <tr>
                  {isDirOwner && (
                    <td class="chbox">
                      <label>
                        <Checkbox />
                      </label>
                    </td>
                  )}
                  <td class="name">
                    <InodeAnchor inode={inode} />
                  </td>
                  <td class="type">
                    {inode.type === "file" ? inode.fileType : "Folder"}
                  </td>
                  <td class="date">
                    <RelativeTime uuid={inode.id} />
                  </td>
                  <td class="size">
                    {inode.type === "file" ? formatBytes(inode.fileSize) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </>
        )}
      </table>
    </div>
  );
}

function Checkbox() {
  return (
    <input
      type="checkbox"
      autocomplete="off"
      disabled
      class="wait-disabled"
    />
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
  return <a href={href} class={`inode ${inode.type}`}>{name}</a>;
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
