import { getPermissions } from "../../lib/util/permissions.ts";
import type { AppContext, Inode } from "../../util/types.ts";
import Tooltip from "../Tooltip.tsx";

interface Props {
  inode: Inode;
}

export default function InodeVisibility(props: Props, ctx: AppContext) {
  const { inode } = props;
  const others = inode.visibleByOthers || [];

  if (others.length === 1) {
    return <>you and {others[0]}</>;
  }

  if (others.length > 1) {
    return (
      <>
        you and{" "}
        <Tooltip info={new Intl.ListFormat(ctx.locale).format(others)}>
          <span class="permissions-others">{others.length} others</span>
        </Tooltip>
      </>
    );
  }

  const perm = getPermissions({ user: null, resource: inode });

  if (perm.canRead) {
    return <>public</>;
  }

  return <>private</>;
}
