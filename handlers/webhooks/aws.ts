import { STATUS_CODE } from "@std/http";
import { AWS_WEBHOOKS_KEY } from "../../util/consts.ts";
import { enqueue } from "../../util/kv/enqueue.ts";
import { QueueMsgGeneralMediaProcessorEvent } from "../../util/queue/post_processor_event/general_media_processor_event.ts";
import { type QueueMsgImageProcessorEvent } from "../../util/queue/post_processor_event/image_processor_event.ts";
import { type QueueMsgVideoProcessorEvent } from "../../util/queue/post_processor_event/video_processor_event.ts";
import type { AppContext } from "../../util/types.ts";

export async function awsWebhookHandler(ctx: AppContext) {
  const apiKey = ctx.req.headers.get("X-Api-Key");

  if (apiKey !== AWS_WEBHOOKS_KEY) {
    return ctx.respond(null, STATUS_CODE.Forbidden);
  }

  const msg = await ctx.req.json();

  switch (msg.source) {
    case "aws.mediaconvert": {
      await enqueue<QueueMsgVideoProcessorEvent>({
        type: "video-processor-event",
        detail: msg.detail,
      }).commit();
      break;
    }

    case "hotspace.image-processor": {
      await enqueue<QueueMsgImageProcessorEvent>({
        type: "image-processor-event",
        time: msg.time,
        detail: msg.detail,
      }).commit();
      break;
    }

    case "hotspace.libre-processor": {
      await enqueue<QueueMsgGeneralMediaProcessorEvent>({
        type: "general-media-processor-event",
        time: msg.time,
        detail: msg.detail,
      }).commit();
      break;
    }

    default: {
      console.error("Unhandled AWS webhook message", msg);
    }
  }

  return ctx.respond();
}
