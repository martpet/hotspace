import { STATUS_CODE } from "@std/http";
import { GENERAL_ERR_MSG } from "../../util/consts.ts";
import { deleteFile } from "../../util/inodes_helpers.ts";
import { getDirNode, getInodeByDir } from "../../util/kv/inodes.ts";
import type { AppContext, FileNode } from "../../util/types.ts";
import { parsePathname } from "../../util/url.ts";

interface FormEntries {
  pathname: string;
}

export default async function deleteFileHandler(ctx: AppContext) {
  const { user } = ctx.state;

  if (!user) {
    return ctx.respond(null, STATUS_CODE.Forbidden);
  }

  const formData = await ctx.req.formData();
  const formEntries = Object.fromEntries(formData.entries());

  if (!isValidFormEntries(formEntries)) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  const {
    isDir,
    parentPathSegments,
    lastPathSegment,
  } = parsePathname(formEntries.pathname);

  if (isDir) {
    ctx.respond(null, STATUS_CODE.BadRequest);
  }

  const parentDirPath = `/${parentPathSegments.join("/")}/`;
  const parentDir = (await getDirNode(parentPathSegments)).value;

  if (!parentDir) {
    ctx.setFlash({ type: "error", msg: `Not Found` });
    return ctx.redirect("/");
  }

  const fileNodeEntry = await getInodeByDir<FileNode>({
    inodeName: lastPathSegment,
    parentDirId: parentDir.id,
  });

  const fileNode = fileNodeEntry.value;

  if (!fileNode) {
    ctx.setFlash({ type: "error", msg: `Not Found` });
    return ctx.redirect(parentDirPath);
  }

  if (fileNode.ownerId !== user.id) {
    ctx.setFlash({ type: "error", msg: "Not Allowed" });
    return ctx.redirectBack();
  }

  const commit = await deleteFile({
    fileNodeEntry,
    parentDirId: parentDir.id,
    user,
  }).commit();

  if (!commit.ok) {
    ctx.setFlash({ type: "error", msg: GENERAL_ERR_MSG });
    return ctx.redirectBack();
  }

  ctx.setFlash(`Successfully deleted '${lastPathSegment}'`);
  return ctx.redirect(parentDirPath);
}

function isValidFormEntries(entries: unknown): entries is FormEntries {
  const { pathname } = entries as Partial<FormEntries>;
  return typeof pathname === "string";
}
