import { STATUS_CODE } from "@std/http";
import { deleteDirChildren } from "../../util/inodes_helpers.ts";
import { getDirNode, keys as getInodeKey } from "../../util/kv/inodes.ts";
import { getManyEntries } from "../../util/kv/kv.ts";
import type { AppContext, Inode } from "../../util/types.ts";
import { parsePathname } from "../../util/url.ts";

interface ReqData {
  pathnames: string[];
}

export default async function batchDeleteHandler(ctx: AppContext) {
  const { user } = ctx.state;

  if (!user) {
    return ctx.respond(null, STATUS_CODE.Forbidden);
  }

  const reqData = await ctx.req.json();

  if (!isValidReqData(reqData)) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  const { pathnames } = reqData;
  const { isRootPathSegment, parentPathSegments } = parsePathname(pathnames[0]);

  if (isRootPathSegment) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  const parentDir = (await getDirNode(parentPathSegments)).value;

  if (!parentDir) {
    return ctx.respond(null, STATUS_CODE.NotFound);
  }

  const inodesKeys = pathnames.map((pathname) =>
    getInodeKey.byDir(
      parentDir.id,
      parsePathname(pathname).lastPathSegment,
    )
  );

  await deleteDirChildren({
    entries: await getManyEntries<Inode>(inodesKeys),
    dirId: parentDir.id,
    pathSegments: parentPathSegments,
    userId: user.id,
  });

  return ctx.respond();
}

function isValidReqData(data: unknown): data is ReqData {
  const { pathnames } = data as Partial<ReqData>;
  return Array.isArray(pathnames) &&
    pathnames.length > 0 &&
    pathnames.every((it) => typeof it === "string");
}
