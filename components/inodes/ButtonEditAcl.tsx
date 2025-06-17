import { checkHasPublicAccess } from "$util";
import { type JSX } from "preact";
import { getInodeLabel } from "../../util/inodes/helpers.ts";
import type { Inode } from "../../util/inodes/types.ts";

interface Props extends JSX.HTMLAttributes<HTMLButtonElement> {
  inode: Inode;
}

export default function ButtonEditAccess(props: Props) {
  const { inode, ...btnProps } = props;
  const { aclStats } = inode;
  const previwSubsetLength = Object.keys(aclStats.previewSubset).length;
  const hasMoreAclItems = aclStats.usersCount > previwSubsetLength;

  return (
    <button
      disabled
      class="inode-edit-acl nobtn wait-disabled"
      title={btnProps.title || "Edit access"}
      data-inode-id={inode.id}
      data-inode-label={getInodeLabel(inode)}
      data-acl={hasMoreAclItems ? null : JSON.stringify(aclStats.previewSubset)}
      data-has-pub-access={checkHasPublicAccess(inode) ? "1" : null}
    >
      <i class="icn-gear" />
    </button>
  );
}
