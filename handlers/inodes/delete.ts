import { parsePathname } from "$util";
import { STATUS_CODE } from "@std/http";
import { deleteInodesComplete } from "../../util/inodes_helpers.ts";
import {
  getDirByPath,
  keys as getInodeByDirKey,
} from "../../util/kv/inodes.ts";
import { getManyEntries } from "../../util/kv/kv.ts";
import type { AppContext, Inode } from "../../util/types.ts";

interface ReqData {
  pathname: string;
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

  const { pathname, inodesNames } = reqData;
  const path = parsePathname(pathname);

  if (!path.isDir) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  const dir = (await getDirByPath(path.segments)).value;

  if (!dir) {
    return ctx.respond(null, STATUS_CODE.NotFound);
  }

  const inodesKeys = inodesNames.map((inodeName) =>
    getInodeByDirKey.byDir(dir.id, inodeName)
  );

  const entries = (await getManyEntries<Inode>(inodesKeys))
    .filter((entry) =>
      user.id === entry.value?.ownerId ||
      user.id === dir.ownerId
    );

  await deleteInodesComplete(entries);

  return ctx.respond();
}

function isValidReqData(data: unknown): data is ReqData {
  const { pathname, inodesNames } = data as Partial<ReqData>;
  return typeof data === "object" &&
    typeof pathname === "string" &&
    Array.isArray(inodesNames) &&
    inodesNames.length > 0 &&
    inodesNames.every((it) => typeof it === "string");
}
