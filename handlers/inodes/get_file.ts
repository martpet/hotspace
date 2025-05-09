import { getPermissions } from "$util";
import { STATUS_CODE } from "@std/http";
import { getFileNodeUrl } from "../../util/inodes/helpers.ts";
import { getInodeById } from "../../util/kv/inodes.ts";
import type { AppContext } from "../../util/types.ts";

export default async function getFileHandler(ctx: AppContext) {
  const { inodeId } = ctx.urlPatternResult.pathname.groups;
  const { user } = ctx.state;

  if (!inodeId) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  const { value: inode } = await getInodeById(inodeId);

  if (!inode) {
    return ctx.respond(null, STATUS_CODE.NotFound);
  }

  if (inode.type !== "file") {
    return ctx.respond(null, STATUS_CODE.Conflict);
  }

  const { canRead } = getPermissions({ resource: inode, user });

  if (!canRead) {
    return ctx.respond(null, STATUS_CODE.Forbidden);
  }

  const url = await getFileNodeUrl(inode.s3Key, { isDownload: true });

  return ctx.redirect(url);
}
