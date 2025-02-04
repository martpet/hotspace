import { STATUS_CODE } from "@std/http";
import { GENERAL_ERR_MSG } from "../../util/consts.ts";
import { getDir, setDir } from "../../util/kv/inodes.ts";
import { kv } from "../../util/kv/kv.ts";
import type { AppContext } from "../../util/types.ts";
import { isValidDirPath, parsePath } from "../../util/url.ts";

interface FormEntries {
  pathname: string;
}

export default async function toggleChatHandler(ctx: AppContext) {
  const { user } = ctx.state;

  if (!user) {
    return ctx.respond(null, STATUS_CODE.Unauthorized);
  }

  const formData = await ctx.req.formData();
  const formEntries = Object.fromEntries(formData.entries());

  if (!isValidFormEntries(formEntries)) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  const path = parsePath(formEntries.pathname);
  const inodeEntry = await getDir(path.segments);
  const inode = inodeEntry.value;

  if (!inode) {
    return ctx.redirectBack();
  }

  if (inode.ownerId !== user.id) {
    const msg = "You don't have permissions to toggle the chat";
    ctx.setFlash({ type: "error", msg });
    return ctx.redirectBack();
  }

  let parentDir;

  if (!path.isRootSegment) {
    parentDir = (await getDir(path.parentSegments)).value;
    if (!parentDir) return ctx.redirectBack();
  }

  inode.chatEnabled = !inode.chatEnabled;

  const atomic = kv.atomic();
  atomic.check(inodeEntry);

  setDir({
    dir: inode,
    parentDir,
    pathSegments: path.segments,
    atomic,
  });

  const commit = await atomic.commit();

  if (!commit.ok) {
    ctx.setFlash({ type: "error", msg: GENERAL_ERR_MSG });
  }

  return ctx.redirectBack();
}

function isValidFormEntries(entries: unknown): entries is FormEntries {
  const { pathname } = entries as FormEntries;
  return typeof entries === "object" && isValidDirPath(pathname);
}
