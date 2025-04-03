import { STATUS_CODE } from "@std/http";
import { AWS_WEBHOOKS_KEY } from "../../util/consts.ts";
import { enqueue } from "../../util/kv/enqueue.ts";
import type { AppContext } from "../../util/types.ts";
import { QueueMsgMediaConvertEvent } from "../queue/media_convert_event.ts";

export default async function mediaConvertEventHandler(ctx: AppContext) {
  const apiKey = ctx.req.headers.get("X-Api-Key");

  if (apiKey !== AWS_WEBHOOKS_KEY) {
    ctx.respond(null, STATUS_CODE.Unauthorized);
  }

  const data = await ctx.req.json();
  const { status } = data.detail;
  const jobPercentComplete = data.detail.jobProgress?.jobPercentComplete;
  const { inodeId, origin } = data.detail.userMetadata;
  const duratonInMs = data.detail.outputGroupDetails?.[0].outputDetails[0]
    .durationInMs;

  await enqueue<QueueMsgMediaConvertEvent>({
    type: "media-convert-event",
    inodeId,
    status,
    origin,
    jobPercentComplete,
    duratonInMs,
  }).commit();

  return ctx.respond();
}
