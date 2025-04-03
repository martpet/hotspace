import { checkHasPublicAccess } from "$util";
import { type JSX } from "preact";
import type { Inode } from "../../util/inodes/types.ts";
import ButtonEditAcl from "./ButtonEditAcl.tsx";

type Props = {
  inode: Inode;
  canChangeAcl: boolean;
};

export default function InodeAccess(props: Props) {
  const { inode, canChangeAcl } = props;
  const { usersCount } = inode.aclStats;
  const hasPublicAccess = checkHasPublicAccess(inode);

  const Wrap = (props: JSX.HTMLAttributes<HTMLDivElement>) => (
    <div {...props} class="inode-access">
      {props.children}
      {canChangeAcl && <ButtonEditAcl inode={inode} />}
    </div>
  );

  if (hasPublicAccess) {
    return (
      <Wrap>
        Public
      </Wrap>
    );
  }

  if (usersCount === 1) {
    return (
      <Wrap>
        Private
      </Wrap>
    );
  }

  return (
    <Wrap>
      You and {usersCount - 1} other{usersCount > 2 ? "s" : ""}
    </Wrap>
  );
}
