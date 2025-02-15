import { HEADER, STATUS_CODE } from "@std/http";
import { deleteDirChildren } from "../../util/inodes_helpers.ts";
import { getDirNode, keys as getInodeKey } from "../../util/kv/inodes.ts";
import { getManyEntries } from "../../util/kv/kv.ts";
import type { AppContext, Inode } from "../../util/types.ts";
import { parsePath } from "../../util/url.ts";

interface JsonReqData {
  pathnames: string[];
}

export default async function deleteHandler(ctx: AppContext) {
  const { user } = ctx.state;

  if (!user) {
    return ctx.respond(null, STATUS_CODE.Forbidden);
  }

  let pathnames;

  const isFormRequest = ctx.req.headers.get(HEADER.ContentType) ===
    "application/x-www-form-urlencoded";

  if (isFormRequest) {
    const formData = await ctx.req.formData();
    const pathname = formData.get("pathname");
    if (typeof pathname !== "string") {
      return ctx.respond(null, STATUS_CODE.BadRequest);
    }
    pathnames = [pathname];
  } else {
    const reqData = await ctx.req.json();
    if (!isValidJsonReqData(reqData)) {
      return ctx.respond(null, STATUS_CODE.BadRequest);
    }
    pathnames = reqData.pathnames;
  }

  const path = parsePath(pathnames[0]);

  if (path.isRootSegment) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  const parentDir = (await getDirNode(path.parentSegments)).value;
  const parentDirPathname = `/${path.parentSegments.join("/")}/`;

  if (!parentDir) {
    if (isFormRequest) {
      ctx.setFlash({ type: "error", msg: `Not Found` });
      return ctx.redirect(parentDirPathname);
    } else {
      return ctx.respond(null, STATUS_CODE.NotFound);
    }
  }

  const inodesKeys = pathnames.map((inodePathname) =>
    getInodeKey.byDir(
      parentDir.id,
      parsePath(inodePathname).lastSegment,
    )
  );

  await deleteDirChildren({
    entries: await getManyEntries<Inode>(inodesKeys),
    dirId: parentDir.id,
    pathSegments: path.parentSegments,
    userId: user.id,
  });

  if (isFormRequest) {
    ctx.setFlash(`Successfully deleted '${path.lastSegment}'`);
    return ctx.redirect(parentDirPathname);
  } else {
    return ctx.respond();
  }
}

function isValidJsonReqData(data: unknown): data is JsonReqData {
  const { pathnames } = data as Partial<JsonReqData>;
  return Array.isArray(pathnames) &&
    pathnames.length > 0 &&
    pathnames.every((it) => typeof it === "string");
}
