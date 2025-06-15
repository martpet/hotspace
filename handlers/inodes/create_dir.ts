import { getPermissions } from "$util";
import { STATUS_CODE } from "@std/http";
import { ulid } from "@std/ulid";
import { createAclStats } from "../../util/inodes/acl.ts";
import { ROOT_DIR, ROOT_DIR_ID } from "../../util/inodes/consts.ts";
import { setAnyInode } from "../../util/inodes/kv_wrappers.ts";
import { RESERVED_ROOT_DIR_NAMES } from "../../util/inodes/reserved_dir_names.ts";
import type { DirNode } from "../../util/inodes/types.ts";
import { DIR_NAME_CONSTRAINTS } from "../../util/input_constraints.ts";
import { getDirByPath, getInodeById } from "../../util/kv/inodes.ts";
import { kv } from "../../util/kv/kv.ts";
import type { AppContext } from "../../util/types.ts";

interface ReqData {
  parentDirId: string;
  dirName: string;
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

  const { parentDirId, dirName } = reqData;
  const isParentRoot = parentDirId === ROOT_DIR_ID;

  if (isParentRoot && RESERVED_ROOT_DIR_NAMES.includes(dirName)) {
    const errMsg = `Space name '${dirName}' is not available`;
    return ctx.respond(errMsg, STATUS_CODE.Conflict);
  }

  let parentDirEntry = await getInodeById(parentDirId);

  if (!parentDirEntry.value && isParentRoot) {
    const commit = await setAnyInode(ROOT_DIR).commit();
    if (!commit.ok) return ctx.respond(null, STATUS_CODE.InternalServerError);
    parentDirEntry = await getInodeById(parentDirId);
  }

  const parentDir = parentDirEntry.value;
  const { canCreate } = getPermissions({ user, resource: parentDir });

  if (!parentDir || (!canCreate && !(parentDir as DirNode).isRootDir)) {
    return ctx.respond(null, STATUS_CODE.NotFound);
  }

  if (parentDir.type !== "dir") {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  const pathSegments = [...parentDir.pathSegments, dirName];
  const currentDirEntry = await getDirByPath(pathSegments);
  const currentDir = currentDirEntry.value;

  if (currentDir) {
    let errMsg;
    if (isParentRoot) {
      const who = currentDir.ownerId === user.id ? "you" : "another user";
      errMsg = `Space '${dirName}' is already created by ${who}`;
    } else {
      errMsg = `Folder '${dirName}' already exists`;
    }
    return ctx.respond(errMsg, STATUS_CODE.Conflict);
  }

  let acl = parentDir.acl;
  let aclStats = parentDir.aclStats;

  if (isParentRoot) {
    acl = {
      [user.id]: "admin",
      "*": "viewer",
    };
    aclStats = await createAclStats({ acl, users: [user] });
  }

  const dirNode: DirNode = {
    type: "dir",
    id: ulid(),
    name: dirName,
    parentDirId,
    pathSegments,
    ownerId: user.id,
    acl,
    aclStats,
  };

  const atomic = kv.atomic();
  atomic.check(currentDirEntry, parentDirEntry);
  setAnyInode(dirNode, atomic);
  const commit = await atomic.commit();

  if (!commit.ok) {
    return ctx.respond(null, STATUS_CODE.Conflict);
  }

  return ctx.respond();
}

function isValidReqData(data: unknown): data is ReqData {
  const { parentDirId, dirName } = data as Partial<ReqData>;
  const { minLength, maxLength, pattern } = DIR_NAME_CONSTRAINTS;

  return typeof data === "object" &&
    typeof parentDirId === "string" &&
    typeof dirName === "string" &&
    dirName.length >= minLength &&
    dirName.length <= maxLength &&
    new RegExp(pattern).test(dirName);
}
