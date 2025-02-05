import { STATUS_CODE } from "@std/http";
import { GENERAL_ERR_MSG } from "../../util/consts.ts";
import { getDir, getInode, setDir, setInode } from "../../util/kv/inodes.ts";
import { kv } from "../../util/kv/kv.ts";
import type { AppContext, DirNode } from "../../util/types.ts";
import { parsePath } from "../../util/url.ts";

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

  let inodeEntry;
  let parentDirEntry;

  if (!path.isRootSegment) {
    parentDirEntry = await getDir(path.parentSegments);
    if (!parentDirEntry.value) {
      return ctx.redirectBack();
    }
  }

  if (path.isDir) {
    inodeEntry = await getDir(path.segments);
  } else {
    inodeEntry = await getInode({
      inodeName: path.lastSegment,
      parentDirId: parentDirEntry!.value.id,
    });
  }

  if (!inodeEntry?.value) {
    return ctx.redirectBack();
  }

  const inode = inodeEntry.value;

  if (inode.ownerId !== user.id) {
    ctx.setFlash({ type: "error", msg: "Not allowed" });
    return ctx.redirectBack();
  }

  inode.chatEnabled = !inode.chatEnabled;

  const atomic = kv.atomic();
  atomic.check(inodeEntry);
  if (parentDirEntry) atomic.check(parentDirEntry);

  if (path.isDir) {
    setDir({
      dir: inode as DirNode,
      parentDirId: parentDirEntry?.value.id,
      pathSegments: path.segments,
      atomic,
    });
  } else {
    setInode({
      inode,
      parentDirId: parentDirEntry!.value.id,
      atomic,
    });
  }

  const commit = await atomic.commit();

  if (!commit.ok) {
    ctx.setFlash({ type: "error", msg: GENERAL_ERR_MSG });
  }

  return ctx.redirectBack();
}

function isValidFormEntries(entries: unknown): entries is FormEntries {
  const { pathname } = entries as Partial<FormEntries>;
  return typeof entries === "object" && typeof pathname === "string";
}
