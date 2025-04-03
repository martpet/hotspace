import { STATUS_CODE } from "@std/http";
import { getPermissions } from "../../lib/util/file_permissions.ts";
import { deleteInodesRecursive } from "../../util/inodes/kv_wrappers.ts";
import type { Inode } from "../../util/inodes/types.ts";
import { getInodeById, keys as getInodeKey } from "../../util/kv/inodes.ts";
import { getMany } from "../../util/kv/kv.ts";
import type { AppContext } from "../../util/types.ts";

interface ReqData {
  dirId: string;
  inodesNames: string[];
}

export default async function deleteHandler(ctx: AppContext) {
  const { user } = ctx.state;

  if (!user) {
    return ctx.respond(null, STATUS_CODE.Unauthorized);
  }

  const reqData = await ctx.req.json();

  if (!isValidReqData(reqData)) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  const { dirId, inodesNames } = reqData;
  const dir = (await getInodeById(dirId)).value;

  if (!dir) {
    return ctx.respond(null, STATUS_CODE.NotFound);
  }

  if (dir.type !== "dir") {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  const inodesKeys = inodesNames.map((inodeName) =>
    getInodeKey.byDir(dir.id, inodeName)
  );

  const inodes = (await getMany<Inode>(inodesKeys))
    .filter((inode) => {
      const { canModify } = getPermissions({ user, resource: inode });
      return canModify;
    });

  await deleteInodesRecursive(inodes);

  return ctx.respond();
}

function isValidReqData(data: unknown): data is ReqData {
  const { dirId, inodesNames } = data as Partial<ReqData>;
  return typeof data === "object" &&
    typeof dirId === "string" &&
    Array.isArray(inodesNames) &&
    inodesNames.length > 0 &&
    inodesNames.every((it) => typeof it === "string");
}
