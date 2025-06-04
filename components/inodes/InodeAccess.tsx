import { checkHasPublicAccess } from "$util";
import type { Inode } from "../../util/inodes/types.ts";
import ButtonEditAcl from "./ButtonEditAcl.tsx";

type Props = {
  inode: Inode;
  canChangeAcl: boolean;
};

export default function InodeAccess(props: Props) {
  const { inode, canChangeAcl } = props;

  return (
    <div {...props} class="inode-access">
      {getInodeAccessText(inode)}
      {canChangeAcl && <ButtonEditAcl inode={inode} />}
    </div>
  );
}

export function getInodeAccessText(inode: Inode) {
  const { usersCount } = inode.aclStats;
  const hasPublicAccess = checkHasPublicAccess(inode);

  if (hasPublicAccess) return "Public";
  if (usersCount === 1) return "Private";
  return `You and ${usersCount - 1} other${usersCount > 2 ? "s" : ""}`;
}
