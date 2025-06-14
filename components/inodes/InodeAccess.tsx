import { checkHasPublicAccess, type ResourcePermissions } from "$util";
import type { Inode } from "../../util/inodes/types.ts";
import ButtonEditAcl from "./ButtonEditAcl.tsx";

type Props = {
  inode: Inode;
  perm: ResourcePermissions;
};

export default function InodeAccess(props: Props) {
  const { inode, perm } = props;

  if (!perm.canViewAcl) {
    return null;
  }

  return (
    <div class="inode-access">
      {getInodeAccessText(inode, perm)}
      {perm.canChangeAcl && <ButtonEditAcl inode={inode} />}
    </div>
  );
}

export function getInodeAccessText(inode: Inode, perm: ResourcePermissions) {
  if (!perm.canViewAcl) return "";

  const { usersCount } = inode.aclStats;
  const hasPublicAccess = checkHasPublicAccess(inode);

  if (hasPublicAccess) return "Public";
  if (usersCount === 1) return "Private";
  return `You and ${usersCount - 1} other${usersCount > 2 ? "s" : ""}`;
}
