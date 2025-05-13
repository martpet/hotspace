import { getPermissions } from "$util";
import { STATUS_CODE } from "@std/http";
import { createAclPreview } from "../../../util/inodes/acl.ts";
import { getInodeById } from "../../../util/kv/inodes.ts";
import type { AppContext } from "../../../util/types.ts";

export default async function getAclPreviewHandler(ctx: AppContext) {
  const { user } = ctx.state;
  const { inodeId } = ctx.urlPatternResult.pathname.groups;

  if (!user) {
    ctx.respond(null, STATUS_CODE.Unauthorized);
  }

  if (!inodeId) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  const inodeEntry = await getInodeById(inodeId);
  const inode = inodeEntry.value;
  const { canViewAcl } = getPermissions({ user, resource: inode });

  if (!inode || !canViewAcl) {
    return ctx.respond(null, STATUS_CODE.NotFound);
  }

  const aclPreview = await createAclPreview({ acl: inode.acl });

  return ctx.json(aclPreview);
}
