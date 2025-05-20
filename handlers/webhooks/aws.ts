import { STATUS_CODE } from "@std/http";
import { AWS_WEBHOOKS_KEY } from "../../util/consts.ts";
import { enqueue } from "../../util/kv/enqueue.ts";
import { QueueMsgGeneralPostProcessorEvent } from "../../util/queue/post_processor_event/general_post_processor_event.ts";
import { type QueueMsgSharpProcessorEvent } from "../../util/queue/post_processor_event/sharp_processor_event.ts";
import { type QueueMsgVideoProcessorEvent } from "../../util/queue/post_processor_event/video_processor_event.ts";
import type { AppContext } from "../../util/types.ts";

export default async function awsWebhookHandler(ctx: AppContext) {
  const apiKey = ctx.req.headers.get("X-Api-Key");

  if (apiKey !== AWS_WEBHOOKS_KEY) {
    return ctx.respond(null, STATUS_CODE.Forbidden);
  }

  const msg = await ctx.req.json();
  const queueMsg = getQueueMsg(msg);

  if (queueMsg) {
    await enqueue(queueMsg).commit();
  } else {
    console.error("Unhandled AWS webhook message", msg);
  }

  return ctx.respond();
}

function getQueueMsg(msg: Record<string, unknown>) {
  switch (msg.source) {
    case "aws.mediaconvert":
      return <QueueMsgVideoProcessorEvent> {
        type: "video-processor-event",
        detail: msg.detail,
      };

    case "hotspace.sharp-processor":
      return <QueueMsgSharpProcessorEvent> ({
        type: "sharp-processor-event",
        time: msg.time,
        detail: msg.detail,
      });

    case "hotspace.libre-processor":
    case "hotspace.pandoc-processor":
      return <QueueMsgGeneralPostProcessorEvent> {
        type: "general-post-processor-event",
        time: msg.time,
        detail: msg.detail,
      };
  }
}
