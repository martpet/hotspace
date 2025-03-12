import { STATUS_CODE } from "@std/http";
import { MEDIA_CONVERT_WEBHOOK_KEY } from "../../util/consts.ts";
import { enqueue } from "../../util/kv/enqueue.ts";
import type { AppContext } from "../../util/types.ts";
import { QueueMsgMediaConvertEvent } from "../queue/media_convert_event.ts";

export default async function mediaConvertEventHandler(ctx: AppContext) {
  const apiKey = ctx.req.headers.get("X-Api-Key");

  if (apiKey !== MEDIA_CONVERT_WEBHOOK_KEY) {
    ctx.respond(null, STATUS_CODE.Unauthorized);
  }

  const data = await ctx.req.json();
  const { status } = data.detail;
  const jobPercentComplete = data.detail.jobProgress?.jobPercentComplete;
  const { inodeId, origin } = data.detail.userMetadata;

  await enqueue<QueueMsgMediaConvertEvent>({
    type: "media-convert-event",
    inodeId,
    status,
    jobPercentComplete,
    origin,
  }).commit();

  return ctx.respond();
}
