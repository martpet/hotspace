import { STATUS_CODE } from "@std/http";
import { ulid } from "@std/ulid";
import {
  getDirByPath,
  setDirByPath,
  setInodeByDir,
  setRootDirByOwner,
} from "../../util/kv/inodes.ts";
import { kv } from "../../util/kv/kv.ts";
import { reservedWords } from "../../util/reserved_words.ts";
import type { AppContext, DirNode } from "../../util/types.ts";
import { getDirPathInfo, isValidPathname } from "../../util/url.ts";

interface ReqData {
  pathname: string;
}

export default async function createDirHandler(ctx: AppContext) {
  const { user } = ctx.state;

  if (!user) {
    return ctx.respond(null, STATUS_CODE.Unauthorized);
  }

  const reqData = await ctx.req.json();

  if (!isValidReqData(reqData)) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  const {
    dirName,
    isRootDir,
    dirPathParts,
    parentDirPathParts,
  } = getDirPathInfo(reqData.pathname);

  if (!dirName) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  if (isRootDir && reservedWords.includes(dirName)) {
    const errMsg = `Space name '${dirName}' is not available`;
    return ctx.respond(errMsg, STATUS_CODE.Conflict);
  }

  let parentDirEntry;

  if (!isRootDir) {
    parentDirEntry = await getDirByPath(parentDirPathParts);
    if (!parentDirEntry.value || parentDirEntry.value.ownerId !== user.id) {
      return ctx.respond(null, STATUS_CODE.Forbidden);
    }
  }

  const currentDirByPathEntry = await getDirByPath(dirPathParts);
  const currentDirByPath = currentDirByPathEntry.value;

  if (currentDirByPath) {
    let errMsg;
    if (isRootDir) {
      const who = currentDirByPath.ownerId === user.id ? "you" : "another user";
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
  setDirByPath({ dir, dirPathParts, atomic }).check(currentDirByPathEntry);
  if (isRootDir) {
    setRootDirByOwner(dir, atomic);
  } else if (parentDirEntry) {
    setInodeByDir({
      dirId: parentDirEntry.value.id,
      inode: dir,
      atomic,
    }).check(parentDirEntry);
  }
  const commit = await atomic.commit();

  if (!commit.ok) {
    return ctx.respond(null, STATUS_CODE.Conflict);
  } else {
    ctx.setFlash(
      `Successfully created ${isRootDir ? "space" : "folder"} '${dirName}'`,
    );
    return ctx.respond();
  }
}

function isValidReqData(data: unknown): data is ReqData {
  const { pathname } = data as Partial<ReqData>;
  return typeof data === "object" && isValidPathname(pathname);
}
