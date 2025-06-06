import { getPermissions, parsePathname, type ResourcePermissions } from "$util";
import { format as formatBytes } from "@std/fmt/bytes";
import { decodeTime } from "@std/ulid";
import { type JSX } from "preact";
import { getFileNodeKind } from "../../util/inodes/helpers.ts";
import type { FileNode, Inode } from "../../util/inodes/types.ts";
import type { AppContext, User } from "../../util/types.ts";
import BlankSlate from "../BlankSlate.tsx";
import RelativeTime from "../RelativeTime.tsx";
import InodeAccess, { getInodeAccessText } from "./InodeAccess.tsx";
import { InodeAnchor } from "./InodeAnchor.tsx";

type SkippedCol = "size" | "kind";
type Sorting = Record<string, "ascending" | "descending">;

const DEFAULT_SORT_COL = "date";
const DEFAULT_SORT_ORDER = "descending";

interface Props {
  inodes: Inode[];
  canCreate: boolean;
  isMultiSelect?: boolean;
  skipCols?: SkippedCol[];
  skipIcons?: boolean;
  blankSlate?: JSX.Element;
  inodesPermissions?: InodesPermissions;
}

interface InodesPermissions {
  canModifySome: boolean;
  canViewAclSome: boolean;
  canChangeAclSome: boolean;
  byId: Record<string, ResourcePermissions>;
}

export default function InodesTable(props: Props, ctx: AppContext) {
  const {
    inodes,
    canCreate,
    inodesPermissions = getInodesPermissions(inodes, ctx.state.user),
    isMultiSelect = true,
    skipCols,
    skipIcons,
    blankSlate,
  } = props;

  const path = parsePathname(ctx.url.pathname);
  const isSpaceRoot = path.segments.length === 1;
  const skipSize = skipCols?.includes("size");
  const skipKind = skipCols?.includes("kind");
  const { canViewAclSome, canModifySome } = inodesPermissions;
  let sorting: Sorting = { [DEFAULT_SORT_COL]: DEFAULT_SORT_ORDER };

  if (ctx.cookies.sort) {
    const cookieSorting = JSON.parse(decodeURIComponent(ctx.cookies.sort));
    const [col, order] = Object.entries(cookieSorting)[0];
    if (
      (col !== DEFAULT_SORT_COL || order !== DEFAULT_SORT_ORDER) &&
      (col !== "access" || canViewAclSome) &&
      !skipCols?.includes(col as SkippedCol)
    ) {
      sorting = cookieSorting;
      sortInodes({ inodes, sorting, inodesPermissions });
    }
  }

  const [initialSortCol, initialSortOrder] = Object.entries(sorting)[0];

  return (
    <div
      id="inodes"
      data-sort-col={initialSortCol}
      data-sort-order={initialSortOrder}
    >
      {inodes.length === 0 && canCreate && (
        blankSlate || (
          <BlankSlate
            title={`Empty ${isSpaceRoot ? "space" : "folder"}`}
            subTitle={`Upload files or create
              ${isSpaceRoot ? "" : "sub"} folders.`}
          />
        )
      )}

      {inodes.length > 0 && (
        <table class="inodes-table">
          <thead>
            <tr>
              {canModifySome && (
                <th class="select">
                  {isMultiSelect && <SelectInput isMultiSelect />}
                </th>
              )}
              <th class="name" aria-sort={sorting.name}>
                <button data-sort="name">Name</button>
              </th>
              <th class="date" aria-sort={sorting.date}>
                <button data-sort="date">Created</button>
              </th>
              {canViewAclSome && (
                <th aria-sort={sorting.access}>
                  <button data-sort="access">Access</button>
                </th>
              )}
              {!skipSize && (
                <th class="size" aria-sort={sorting.size}>
                  <button data-sort="size">Size</button>
                </th>
              )}
              {!skipKind && (
                <th class="kind" aria-sort={sorting.kind}>
                  <button data-sort="kind">Kind</button>
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {inodes.map((inode) => {
              const perm = inodesPermissions.byId[inode.id];

              if (!perm.canRead) {
                return null;
              }

              return (
                <tr data-type={inode.type}>
                  {perm.canModify && (
                    <td class="select">
                      <SelectInput isMultiSelect={isMultiSelect} />
                    </td>
                  )}
                  <td class="name">
                    <InodeAnchor inode={inode} skipIcons={skipIcons} />
                  </td>
                  <td class="date">
                    <RelativeTime ulid={inode.id} />
                  </td>
                  {canViewAclSome && (
                    <td class="access">
                      <InodeAccess inode={inode} perm={perm} />
                    </td>
                  )}
                  {!skipSize && (
                    <td
                      class="size"
                      data-bytes={inode.type === "file"
                        ? inode.fileSize
                        : undefined}
                    >
                      {inode.type === "file"
                        ? formatBytes(inode.fileSize)
                        : "--"}
                    </td>
                  )}
                  {!skipKind && (
                    <td class="kind">
                      {inode.type === "file"
                        ? getFileNodeKind(inode)
                        : "Folder"}
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

function sortInodes(options: {
  inodes: Inode[];
  sorting: Sorting;
  inodesPermissions: InodesPermissions;
}) {
  const { inodes, sorting, inodesPermissions } = options;
  const col = Object.keys(sorting)[0];
  const order = sorting[col] === "descending" ? -1 : 1;

  const selector = (inode: Inode) => {
    const perm = inodesPermissions.byId[inode.id];
    if (col === "name") return inode.name;
    if (col === "kind") return inode.type === "file" && getFileNodeKind(inode);
    if (col === "access") return getInodeAccessText(inode, perm);
    if (col === "date") return decodeTime(inode.id);
    if (col === "size") return (inode as FileNode).fileSize || 0;
  };

  inodes.sort((inodeA, inodeB) => {
    const a = selector(inodeA);
    const b = selector(inodeB);
    const aIsDir = inodeA.type === "dir";
    const bIsDir = inodeB.type === "dir";

    if (col === "kind" && aIsDir !== bIsDir) {
      return aIsDir ? -1 : 1;
    }

    let primary = 0;
    if (typeof a === "string" && typeof b === "string") {
      primary = order * a.localeCompare(b);
    } else if (typeof a === "number" && typeof b === "number") {
      primary = order * (a > b ? 1 : a < b ? -1 : 0);
    }

    if (primary !== 0) return primary;

    return inodeA.name.localeCompare(inodeB.name);
  });
}

export function getInodesPermissions(inodes: Inode[], user: User | undefined) {
  const result: InodesPermissions = {
    canModifySome: false,
    canViewAclSome: false,
    canChangeAclSome: false,
    byId: {},
  };

  result.byId = Object.fromEntries(inodes.map((inode) => {
    const perm = getPermissions({ user, resource: inode });
    if (perm.canModify) result.canModifySome = true;
    if (perm.canViewAcl) result.canViewAclSome = true;
    if (perm.canChangeAcl) result.canChangeAclSome = true;
    return [inode.id, perm];
  }));

  return result;
}
