import { parsePathname, type ResourcePermissions } from "$util";
import { format as formatBytes } from "@std/fmt/bytes";
import { type JSX } from "preact";
import type { AppContext, Inode } from "../../util/types.ts";
import BlankSlate from "../BlankSlate.tsx";
import RelativeTime from "../RelativeTime.tsx";
import { InodeAnchor } from "./InodeAnchor.tsx";
import InodeVisibility from "./InodeVisibility.tsx";

interface Props {
  inodes: Inode[];
  inodesPermissions: ResourcePermissions[];
  canCreate: boolean;
  canModifySome: boolean;
  canChangeAclSome: boolean;
  isMultiSelect?: boolean;
  skipCols?: ("size" | "type")[];
  skipIcons?: boolean;
  blankSlate?: JSX.Element;
}

export default function InodesTable(props: Props, ctx: AppContext) {
  const {
    inodes,
    inodesPermissions,
    canCreate,
    canModifySome,
    canChangeAclSome,
    isMultiSelect = true,
    skipCols,
    skipIcons,
    blankSlate,
  } = props;

  const path = parsePathname(ctx.url.pathname);
  const isParentSpace = path.segments.length === 1;
  const skipSize = skipCols?.includes("size");
  const skipType = skipCols?.includes("type");

  return (
    <div id="inodes">
      {inodes.length === 0 && canCreate && (
        blankSlate || (
          <BlankSlate
            title="No items"
            subTitle={`You don't have any items in this ${
              isParentSpace ? "space" : "folder"
            }.`}
          />
        )
      )}

      {inodes.length > 0 && (
        <table class="inodes-table">
          <thead>
            <tr>
              <th class="select">
                {canModifySome && isMultiSelect && (
                  <SelectInput isMultiSelect={isMultiSelect} />
                )}
              </th>
              <th class="name">Name</th>
              {!skipType && <th class="type">Type</th>}
              {canChangeAclSome && <th>Visibility</th>}
              <th class="date">Created</th>
              {!skipSize && <th class="size">Size</th>}
            </tr>
          </thead>

          <tbody>
            {inodes.sort(inodesSorter).map((inode, i) => {
              const perm = inodesPermissions[i];
              if (!perm.canRead) {
                return null;
              }
              return (
                <tr>
                  <td class="select">
                    {perm.canModify && (
                      <SelectInput isMultiSelect={isMultiSelect} />
                    )}
                  </td>
                  <td class="name">
                    <InodeAnchor inode={inode} skipIcons={skipIcons} />
                  </td>
                  {!skipType && (
                    <td class="type">
                      {inode.type === "file" ? inode.fileType : "Folder"}
                    </td>
                  )}
                  {canChangeAclSome && (
                    <td>
                      {perm.canChangeAcl && <InodeVisibility inode={inode} />}
                    </td>
                  )}
                  <td class="date">
                    <RelativeTime uuid={inode.id} />
                  </td>
                  {!skipSize && (
                    <td class="size">
                      {inode.type === "file"
                        ? formatBytes(inode.fileSize)
                        : "-"}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

function inodesSorter(a: Inode, b: Inode) {
  if (a.type === "dir" && b.type !== "dir") return -1;
  if (a.type !== "dir" && b.type === "dir") return 1;
  const aName = a.name.toLowerCase();
  const bName = b.name.toLocaleLowerCase();
  if (aName > bName) return 1;
  if (aName < bName) return -1;
  return 0;
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
