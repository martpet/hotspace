import { parsePathname } from "$util";
import { STATUS_CODE } from "@std/http";
import { setInode } from "../../util/inodes_helpers.ts";
import { getDirByPath, getInodeByDir } from "../../util/kv/inodes.ts";
import { kv } from "../../util/kv/kv.ts";
import type { AppContext } from "../../util/types.ts";

interface ReqData {
  pathname: string;
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

  const path = parsePathname(reqData.pathname);

  if (path.isRoot) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  const parentDirEntry = await getDirByPath(path.parentSegments);
  const parentDir = parentDirEntry.value;

  if (!parentDir) {
    return ctx.respond(null, STATUS_CODE.NotFound);
  }

  const inodeEntry = await getInodeByDir({
    inodeName: path.lastSegment,
    parentDirId: parentDir.id,
  });

  if (!inodeEntry?.value) {
    return ctx.respond(null, STATUS_CODE.NotFound);
  }

  const inode = inodeEntry.value;

  if (inode.ownerId !== user.id) {
    return ctx.respond(null, STATUS_CODE.NotFound);
  }

  inode.chatEnabled = !inode.chatEnabled;

  const atomic = kv.atomic();
  atomic.check(inodeEntry);
  if (parentDirEntry) atomic.check(parentDirEntry);

  setInode({
    inode,
    pathSegments: path.segments,
    parentDirId: parentDir.id,
    atomic,
  });

  const commit = await atomic.commit();

  if (!commit.ok) {
    return ctx.respond(null, STATUS_CODE.Conflict);
  }

  return ctx.respond();
}

function isValidReqData(data: unknown): data is ReqData {
  const { pathname } = data as Partial<ReqData>;
  return typeof data === "object" && typeof pathname === "string";
}
