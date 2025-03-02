import { STATUS_CODE } from "@std/http";
import { MEDIA_CONVERT_WEBHOOK_KEY } from "../../util/consts.ts";
import { updateInodeWithRetry } from "../../util/inodes/util.ts";
import { getInodeById } from "../../util/kv/inodes.ts";
import type { AppContext, VideoNode } from "../../util/types.ts";

export default async function awsMediaConvertWebHookHandler(ctx: AppContext) {
  const apiKey = ctx.req.headers.get("X-Api-Key");

  if (apiKey !== MEDIA_CONVERT_WEBHOOK_KEY) {
    ctx.respond(null, STATUS_CODE.Unauthorized);
  }

  const data = await ctx.req.json();
  const status = data.detail.status;
  const inodeId = data.detail.userMetadata.inodeId;
  const entry = await getInodeById<VideoNode>(inodeId);
  const inode = entry.value;

  if (!inode) {
    return ctx.respond();
  }

  inode.convertData.status = status;

  await updateInodeWithRetry(entry, inode);

  return ctx.respond();
}
