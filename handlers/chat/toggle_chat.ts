import { STATUS_CODE } from "@std/http";
import {
  getDirNode,
  getInodeByDir,
  setDirNode,
  setInodeByDir,
} from "../../util/kv/inodes.ts";
import { kv } from "../../util/kv/kv.ts";
import type { AppContext, DirNode } from "../../util/types.ts";
import { parsePathname } from "../../util/url.ts";

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

  const {
    parentPathSegments,
    isRootPathSegment,
    isDir,
    pathSegments,
    lastPathSegment,
  } = parsePathname(reqData.pathname);

  let inodeEntry;
  let parentDirEntry;

  if (!isRootPathSegment) {
    parentDirEntry = await getDirNode(parentPathSegments);
    if (!parentDirEntry.value) {
      return ctx.respond(null, STATUS_CODE.NotFound);
    }
  }

  if (isDir) {
    inodeEntry = await getDirNode(pathSegments);
  } else {
    inodeEntry = await getInodeByDir({
      inodeName: lastPathSegment,
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

  if (isDir) {
    setDirNode({
      dirNode: inode as DirNode,
      parentDirId: parentDirEntry?.value.id,
      pathSegments,
      atomic,
    });
  } else {
    setInodeByDir({
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
