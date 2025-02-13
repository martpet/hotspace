import { STATUS_CODE } from "@std/http";
import { GENERAL_ERR_MSG } from "../../util/consts.ts";
import { deleteFileNode, getDir, getInode } from "../../util/kv/inodes.ts";
import type { AppContext, FileNode } from "../../util/types.ts";
import { parsePathname } from "../../util/url.ts";

interface FormEntries {
  pathname: string;
}

export default async function deleteInodeHandler(ctx: AppContext) {
  const { user } = ctx.state;

  if (!user) {
    return ctx.respond(null, STATUS_CODE.Forbidden);
  }

  const formData = await ctx.req.formData();
  const formEntries = Object.fromEntries(formData.entries());

  if (!isValidFormEntries(formEntries)) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  const { parentSegments, lastSegment } = parsePathname(formEntries.pathname);
  const parentDir = (await getDir(parentSegments)).value;
  const parentDirPath = `/${parentSegments.join("/")}/`;

  if (!parentDir) {
    ctx.setFlash({ type: "error", msg: `Not Found` });
    return ctx.redirect("/");
  }

  const fileNodeEntry = await getInode<FileNode>({
    inodeName: lastSegment,
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

  const commit = await deleteFileNode({
    fileNodeEntry,
    parentDirId: parentDir.id,
    user,
  }).commit();

  if (!commit.ok) {
    ctx.setFlash({ type: "error", msg: GENERAL_ERR_MSG });
    return ctx.redirectBack();
  }

  ctx.setFlash(`Successfully deleted '${lastSegment}'`);
  return ctx.redirect(parentDirPath);
}

function isValidFormEntries(entries: unknown): entries is FormEntries {
  const { pathname } = entries as Partial<FormEntries>;
  return typeof pathname === "string";
}
