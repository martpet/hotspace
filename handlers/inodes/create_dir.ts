import { parsePathname, pathnameToSegments } from "$util";
import { STATUS_CODE } from "@std/http";
import { ulid } from "@std/ulid";
import { DIR_NAME_CONSTRAINTS } from "../../util/constraints.ts";
import { createRootDir, setInode } from "../../util/inodes_helpers.ts";
import { getDirByPath } from "../../util/kv/inodes.ts";
import { kv } from "../../util/kv/kv.ts";
import { reservedWords } from "../../util/reserved_words.ts";
import type { AppContext } from "../../util/types.ts";

interface ReqData {
  pathname: string;
}

export default async function createDirNodeHandler(ctx: AppContext) {
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

  const dirName = path.lastSegment;

  if (path.isRootSegment && reservedWords.includes(dirName)) {
    const errMsg = `Space name '${dirName}' is not available`;
    return ctx.respond(errMsg, STATUS_CODE.Conflict);
  }

  let parentDirEntry = await getDirByPath(path.parentSegments);

  if (!parentDirEntry.value && path.isRootSegment) {
    const commit = await createRootDir();
    if (!commit.ok) return ctx.respond(null, STATUS_CODE.InternalServerError);
    parentDirEntry = await getDirByPath(path.parentSegments);
  }

  const parentDir = parentDirEntry.value;

  if (!parentDir) {
    return ctx.respond(null, STATUS_CODE.NotFound);
  }

  if (!path.isRootSegment && parentDir.ownerId !== user.id) {
    return ctx.respond(null, STATUS_CODE.Forbidden);
  }

  const currentDirEntry = await getDirByPath(path.segments);
  const currentDir = currentDirEntry.value;

  if (currentDir) {
    let errMsg;
    if (path.isRootSegment) {
      const who = currentDir.ownerId === user.id ? "you" : "another user";
      errMsg = `Space '${dirName}' is already created by ${who}`;
    } else {
      errMsg = `Folder '${dirName}' already exists`;
    }
    return ctx.respond(errMsg, STATUS_CODE.Conflict);
  }

  const dirNode = {
    type: "dir",
    id: ulid(),
    name: dirName,
    ownerId: user.id,
  } as const;

  const atomic = kv.atomic();

  atomic.check(currentDirEntry, parentDirEntry);

  setInode({
    inode: dirNode,
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
  const { pattern, minLength, maxLength } = DIR_NAME_CONSTRAINTS;

  return typeof data === "object" &&
    typeof pathname === "string" &&
    pathname.startsWith("/") &&
    pathname.endsWith("/") &&
    pathnameToSegments(pathname).every((segment) =>
      segment.length >= minLength &&
      segment.length <= maxLength &&
      new RegExp(pattern).test(segment)
    );
}
