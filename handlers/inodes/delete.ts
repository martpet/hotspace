import type { CtxRespondFn } from "$server";
import { getPermissions, segmentsToPathname } from "$util";
import { accepts, STATUS_CODE } from "@std/http";
import { getInodeLabel } from "../../util/inodes/helpers.ts";
import { deleteInodesRecursive } from "../../util/inodes/kv_wrappers.ts";
import type { Inode } from "../../util/inodes/types.ts";
import { getInodeById, keys as getInodeKey } from "../../util/kv/inodes.ts";
import { getMany } from "../../util/kv/kv.ts";
import type { AppContext } from "../../util/types.ts";

export const FROM_DELETE = "delete";

interface ReqData {
  dirId: string;
  inodesNames: string[];
}

export default async function deleteHandler(ctx: AppContext) {
  const { user } = ctx.state;
  const acceptsHtml = accepts(ctx.req).includes("text/html");

  function respond(...args: Parameters<CtxRespondFn>) {
    return acceptsHtml ? ctx.redirectBack() : ctx.respond(...args);
  }

  if (!user) {
    return respond(null, STATUS_CODE.Unauthorized);
  }

  let reqData;

  if (acceptsHtml) {
    const formData = await ctx.req.formData();
    reqData = {
      dirId: formData.get("dirId"),
      inodesNames: [formData.get("inodeName")],
    };
  } else {
    reqData = await ctx.req.json();
  }

  if (!isValidReqData(reqData)) {
    return respond(null, STATUS_CODE.BadRequest);
  }

  const { dirId, inodesNames } = reqData;
  const parentDir = (await getInodeById(dirId)).value;

  if (!parentDir) {
    return respond(null, STATUS_CODE.NotFound);
  }

  if (parentDir.type !== "dir") {
    return respond(null, STATUS_CODE.BadRequest);
  }

  const inodesKeys = inodesNames.map((inodeName) =>
    getInodeKey.byDir(parentDir.id, inodeName)
  );

  const inodes = (await getMany<Inode>(inodesKeys))
    .filter((inode) => {
      const { canModify } = getPermissions({ user, resource: inode });
      return canModify;
    });

  await deleteInodesRecursive(inodes);

  if (acceptsHtml) {
    const deletedInode = inodes[0];
    const inodeLabel = getInodeLabel(deletedInode).toLowerCase();
    const inodeName = decodeURIComponent(deletedInode.name);
    let newLocation = segmentsToPathname(parentDir.pathSegments);
    if (!newLocation.endsWith("/")) newLocation += "/";
    newLocation += `?from=${FROM_DELETE}`;
    ctx.setFlash(`Deleted ${inodeLabel} "${inodeName}"`);
    return ctx.redirect(newLocation);
  }

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
