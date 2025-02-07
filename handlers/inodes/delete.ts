import { STATUS_CODE } from "@std/http";
import { GENERAL_ERR_MSG, INODES_BUCKET } from "../../util/consts.ts";
import { enqueue } from "../../util/kv/enqueue.ts";
import { deleteInode, getDir, getInode } from "../../util/kv/inodes.ts";
import { kv } from "../../util/kv/kv.ts";
import { type QueueMsgDeleteChat } from "../../util/kv/queue_handlers/delete_chat.ts";
import { type QueueMsgDeleteS3Objects } from "../../util/kv/queue_handlers/delete_s3_objects.ts";
import { setUploadSize } from "../../util/kv/upload_size.ts";
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
  const parentDirPath = `/${parentSegments.join("/")}/`;
  const parentDir = (await getDir(parentSegments)).value;

  if (!parentDir) {
    ctx.setFlash({ type: "error", msg: `Not Found` });
    return ctx.redirect("/");
  }

  const fileNode = (await getInode<FileNode>({
    inodeName: lastSegment,
    parentDirId: parentDir.id,
  })).value;

  if (!fileNode) {
    ctx.setFlash({ type: "error", msg: `Not Found` });
    return ctx.redirect(parentDirPath);
  }

  if (fileNode.ownerId !== user.id) {
    ctx.setFlash({ type: "error", msg: "Not Allowed" });
    return ctx.redirectBack();
  }

  const atomic = kv.atomic();

  deleteInode({
    inode: fileNode,
    parentDirId: parentDir.id,
    atomic,
  });

  setUploadSize({
    user,
    size: -fileNode.fileSize,
    atomic,
  });

  enqueue<QueueMsgDeleteChat>({
    type: "delete-chat",
    chatId: fileNode.id,
  }, atomic);

  enqueue<QueueMsgDeleteS3Objects>({
    type: "delete-s3-objects",
    s3Keys: [fileNode.s3Key],
    bucket: INODES_BUCKET,
  }, atomic);

  const commit = await atomic.commit();

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
