import { STATUS_CODE } from "@std/http";
import { GENERAL_ERR_MSG } from "../../util/consts.ts";
import {
  getDirByPath,
  setDirByPath,
  setInodeByDir,
  setRootDirByOwner,
} from "../../util/kv/inodes.ts";
import { kv } from "../../util/kv/kv.ts";
import type { AppContext } from "../../util/types.ts";
import { getDirPathInfo, isValidPathname } from "../../util/url.ts";

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

  const { isRootDir, dirPathParts, parentDirPathParts } = getDirPathInfo(
    formEntries.pathname,
  );
  const dirEntry = await getDirByPath(dirPathParts);
  const dir = dirEntry.value;

  if (!dir) {
    return ctx.redirectBack();
  }

  if (dir.ownerId !== user.id) {
    const msg = "You don't have permissions to toggle the chat";
    ctx.setFlash({ type: "error", msg });
    return ctx.redirectBack();
  }

  let parentDir;

  if (!isRootDir) {
    parentDir = (await getDirByPath(parentDirPathParts)).value;
    if (!parentDir) {
      return ctx.redirectBack();
    }
  }

  dir.chatEnabled = !dir.chatEnabled;

  const atomic = kv.atomic();
  setDirByPath({ dir, dirPathParts, atomic }).check(dirEntry);
  if (isRootDir) {
    setRootDirByOwner(dir, atomic);
  } else if (parentDir) {
    setInodeByDir({
      dirId: parentDir.id,
      inode: dir,
      atomic,
    });
  }
  const { ok } = await atomic.commit();

  if (ok) {
    ctx.setFlash(`The chat was ${dir.chatEnabled ? "enabled" : "disabled"} `);
  } else {
    ctx.setFlash({ type: "error", msg: GENERAL_ERR_MSG });
  }

  return ctx.redirectBack();
}

function isValidFormEntries(entries: unknown): entries is FormEntries {
  const { pathname } = entries as FormEntries;
  return typeof entries === "object" && isValidPathname(pathname);
}
