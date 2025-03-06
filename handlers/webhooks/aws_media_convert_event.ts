import { STATUS_CODE } from "@std/http";
import { MEDIA_CONVERT_WEBHOOK_KEY } from "../../util/consts.ts";
import { enqueue } from "../../util/kv/enqueue.ts";
import type { AppContext } from "../../util/types.ts";
import { QueueMsgAwsMediaConvertEvent } from "../queue/aws_media_convert_event.ts";

export default async function awsMediaConvertEventHandler(ctx: AppContext) {
  const apiKey = ctx.req.headers.get("X-Api-Key");

  if (apiKey !== MEDIA_CONVERT_WEBHOOK_KEY) {
    ctx.respond(null, STATUS_CODE.Unauthorized);
  }

  const data = await ctx.req.json();
  const status = data.detail.status;
  const jobPercentComplete = data.detail.jobProgress?.jobPercentComplete;
  const inodeId = data.detail.userMetadata.inodeId;

  await enqueue<QueueMsgAwsMediaConvertEvent>({
    type: "aws-media-convert-event",
    inodeId,
    status,
    jobPercentComplete,
  }).commit();

  return ctx.respond();
}
