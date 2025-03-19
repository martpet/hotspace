import { parsePathname } from "$util";
import { format as formatBytes } from "@std/fmt/bytes";
import type { AppContext, Inode } from "../../util/types.ts";
import BlankSlate from "../BlankSlate.tsx";
import RelativeTime from "../RelativeTime.tsx";

interface Props {
  inodes: Inode[];
  isDirOwner: boolean;
  isSpaces?: boolean;
  isMultiSelect?: boolean;
  skipSize?: boolean;
  skipType?: boolean;
}

export default function InodesTable(props: Props, ctx: AppContext) {
  const {
    inodes,
    isDirOwner,
    isSpaces,
    isMultiSelect = true,
    skipSize,
    skipType,
  } = props;

  const path = parsePathname(ctx.url.pathname);
  const isParentSpace = path.segments.length === 1;

  return (
    <div id="inodes">
      {isSpaces && inodes.length === 0 && isDirOwner && (
        <BlankSlate
          title="No spaces"
          subTitle="You haven't created any spaces yet."
        />
      )}

      {!isSpaces && inodes.length === 0 && isDirOwner && (
        <BlankSlate
          title="No items"
          subTitle={`You don't have any items in this ${
            isParentSpace ? "space" : "folder"
          }.`}
        />
      )}

      {inodes.length > 0 && (
        <table class="inodes-table">
          <thead>
            <tr>
              {isDirOwner && (
                <th class="select">
                  {isMultiSelect && (
                    <SelectInput isMultiSelect={isMultiSelect} />
                  )}
                </th>
              )}
              <th class="name">Name</th>
              {!skipType && <th class="type">Type</th>}
              <th class="date">Created</th>
              {!skipSize && <th class="size">Size</th>}
            </tr>
          </thead>
          <tbody>
            {inodes.sort(sorter).map((inode) => (
              <tr>
                {isDirOwner && (
                  <td class="select">
                    <SelectInput isMultiSelect={isMultiSelect} />
                  </td>
                )}
                <td class="name">
                  <InodeAnchor inode={inode} isSpaces={isSpaces} />
                </td>
                {!skipType && (
                  <td class="type">
                    {inode.type === "file" ? inode.fileType : "Folder"}
                  </td>
                )}
                <td class="date">
                  <RelativeTime uuid={inode.id} />
                </td>
                {!skipSize && (
                  <td class="size">
                    {inode.type === "file" ? formatBytes(inode.fileSize) : "-"}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function SelectInput({ isMultiSelect }: { isMultiSelect: boolean }) {
  return (
    <label>
      <input
        type={isMultiSelect ? "checkbox" : "radio"}
        name="inode"
        autocomplete="off"
        disabled
        class="wait-disabled"
      />
    </label>
  );
}

function InodeAnchor(props: { inode: Inode; isSpaces?: boolean }) {
  const { inode, isSpaces } = props;
  let href = `./${inode.name}`;
  let name = inode.name;
  if (inode.type === "file") {
    name = decodeURIComponent(name);
  } else {
    href = href + "/";
  }
  const classes = isSpaces ? "" : `inode ${inode.type}`;
  return <a href={href} class={classes}>{name}</a>;
}

function sorter(a: Inode, b: Inode) {
  if (a.type === "dir" && b.type !== "dir") return -1;
  if (a.type !== "dir" && b.type === "dir") return 1;
  const aName = a.name.toLowerCase();
  const bName = b.name.toLocaleLowerCase();
  if (aName > bName) return 1;
  if (aName < bName) return -1;
  return 0;
}
