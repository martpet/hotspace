import { parsePath } from "$util";
import { STATUS_CODE } from "@std/http";
import {
  getDirNode,
  getInode,
  setDirNode,
  setInode,
} from "../../util/kv/inodes.ts";
import { kv } from "../../util/kv/kv.ts";
import type { AppContext, DirNode } from "../../util/types.ts";

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

  const path = parsePath(reqData.pathname);

  let inodeEntry;
  let parentDirEntry;

  if (!path.isRootSegment) {
    parentDirEntry = await getDirNode(path.parentSegments);
    if (!parentDirEntry.value) {
      return ctx.respond(null, STATUS_CODE.NotFound);
    }
  }

  if (path.isDir) {
    inodeEntry = await getDirNode(path.segments);
  } else {
    inodeEntry = await getInode({
      inodeName: path.lastSegment,
      parentDirId: parentDirEntry!.value.id,
    });
  }

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

  if (path.isDir) {
    setDirNode({
      dirNode: inode as DirNode,
      parentDirId: parentDirEntry?.value.id,
      pathSegments: path.segments,
      atomic,
    });
  } else {
    setInode({
      inode,
      parentDirId: parentDirEntry!.value.id,
      atomic,
    });
  }

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
