import { STATUS_CODE } from "@std/http";
import { ulid } from "@std/ulid";
import { getDir, setDir } from "../../util/kv/inodes.ts";
import { kv } from "../../util/kv/kv.ts";
import { reservedWords } from "../../util/reserved_words.ts";
import type { AppContext, DirNode } from "../../util/types.ts";
import { isValidDirPath, parsePath } from "../../util/url.ts";

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

  const path = parsePath(reqData.pathname);
  const dirName = path.lastSegment;
  const isRootDir = path.isRootSegment;

  if (!dirName) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  if (isRootDir && reservedWords.includes(dirName)) {
    const errMsg = `Space name '${dirName}' is not available`;
    return ctx.respond(errMsg, STATUS_CODE.Conflict);
  }

  let parentDirEntry;

  if (!isRootDir) {
    parentDirEntry = await getDir(path.parentSegments);
    if (!parentDirEntry.value || parentDirEntry.value.ownerId !== user.id) {
      return ctx.respond(null, STATUS_CODE.Forbidden);
    }
  }

  const currentDirEntry = await getDir(path.segments);
  const currentDir = currentDirEntry.value;

  if (currentDir) {
    let errMsg;
    if (isRootDir) {
      const who = currentDir.ownerId === user.id ? "you" : "another user";
      errMsg = `Space '${dirName}' is already created by ${who}`;
    } else {
      errMsg = `Folder '${dirName}' already exists`;
    }
    return ctx.respond(errMsg, STATUS_CODE.Conflict);
  }

  const dir: DirNode = {
    type: "dir",
    id: ulid(),
    name: dirName,
    ownerId: user.id,
  };

  const atomic = kv.atomic();
  atomic.check(currentDirEntry);
  if (parentDirEntry) atomic.check(parentDirEntry);

  setDir({
    dir,
    parentDir: parentDirEntry?.value,
    pathSegments: path.segments,
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
  return typeof data === "object" && isValidDirPath(pathname);
}
