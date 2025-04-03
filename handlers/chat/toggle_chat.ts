import { STATUS_CODE } from "@std/http";
import { getPermissions } from "../../lib/util/file_permissions.ts";
import { setAnyInode } from "../../util/inodes/kv_wrappers.ts";
import type { DirNode } from "../../util/inodes/types.ts";
import { getInodeById } from "../../util/kv/inodes.ts";
import { kv } from "../../util/kv/kv.ts";
import type { AppContext } from "../../util/types.ts";

interface ReqData {
  inodeId: string;
}

export default async function toggleChatHandler(ctx: AppContext) {
  const { user } = ctx.state;

  if (!user) {
    return ctx.respond(null, STATUS_CODE.Unauthorized);
  }

  const reqData = await ctx.req.json();

  if (!isValidReqData(reqData)) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  const inodeEntry = await getInodeById(reqData.inodeId);
  const inode = inodeEntry.value;
  const { canModerate } = getPermissions({ user, resource: inode });

  if (!inode || !canModerate) {
    return ctx.respond(null, STATUS_CODE.NotFound);
  }

  if ((inode as DirNode).isRootDir) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  inode.chatEnabled = !inode.chatEnabled;

  const atomic = kv.atomic();

  atomic.check(inodeEntry);
  setAnyInode(inode, atomic);

  const commit = await atomic.commit();

  if (!commit.ok) {
    return ctx.respond(null, STATUS_CODE.Conflict);
  }

  return ctx.respond();
}

function isValidReqData(data: unknown): data is ReqData {
  const { inodeId } = data as Partial<ReqData>;
  return typeof data === "object" && typeof inodeId === "string";
}
