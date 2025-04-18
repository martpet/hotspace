import { STATUS_CODE } from "@std/http";
import { AWS_WEBHOOKS_KEY } from "../../util/consts.ts";
import { enqueue } from "../../util/kv/enqueue.ts";
import { type QueueMessageImageProcessorEvent } from "../../util/queue/image_processor_event.ts";
import { type QueueMsgMediaConvertEvent } from "../../util/queue/media_convert_event.ts";
import type { AppContext } from "../../util/types.ts";

export async function awsWebhookHandler(ctx: AppContext) {
  const apiKey = ctx.req.headers.get("X-Api-Key");

  if (apiKey !== AWS_WEBHOOKS_KEY) {
    return ctx.respond(null, STATUS_CODE.Forbidden);
  }

  const msg = await ctx.req.json();

  if (msg.source === "aws.mediaconvert") {
    await enqueue<QueueMsgMediaConvertEvent>({
      type: "mediaconvert-event",
      detail: msg.detail,
    }).commit();
  } else if (msg.source === "hotspace.image-processor") {
    await enqueue<QueueMessageImageProcessorEvent>({
      type: "image-processor-event",
      isoTimestamp: msg.time,
      detail: msg.detail,
    }).commit();
  } else {
    console.error("Unhandled AWS webhook message", msg);
  }

  return ctx.respond();
}
