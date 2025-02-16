import { STATUS_CODE } from "@std/http";
import { deleteDirChildren } from "../../util/inodes_helpers.ts";
import { getDirNode, keys as getInodeKey } from "../../util/kv/inodes.ts";
import { getManyEntries } from "../../util/kv/kv.ts";
import type { AppContext, Inode } from "../../util/types.ts";
import { parsePath } from "../../util/url.ts";

interface ReqData {
  pathname: string;
  inodesNames: string[];
}

export default async function deleteHandler(ctx: AppContext) {
  const { user } = ctx.state;

  if (!user) {
    return ctx.respond(null, STATUS_CODE.Forbidden);
  }

  const reqData = await ctx.req.json();

  if (!isValidReqData(reqData)) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  const { pathname, inodesNames } = reqData;

  if (pathname === "/") {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  const path = parsePath(pathname);
  const dir = (await getDirNode(path.segments)).value;

  if (!dir) {
    return ctx.respond(null, STATUS_CODE.NotFound);
  }

  const inodesKeys = inodesNames.map((inodeName) =>
    getInodeKey.byDir(dir.id, inodeName)
  );

  await deleteDirChildren({
    entries: await getManyEntries<Inode>(inodesKeys),
    dirId: dir.id,
    pathSegments: path.segments,
    userId: user.id,
  });

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
