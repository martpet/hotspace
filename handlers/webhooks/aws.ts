import { STATUS_CODE } from "@std/http";
import { AWS_WEBHOOKS_KEY } from "../../util/consts.ts";
import { enqueue } from "../../util/kv/enqueue.ts";
import type { AppContext } from "../../util/types.ts";
import { type QueueMsgMediaConvertJobState } from "../queue/media_convert_event.ts";

export async function awsWebhookHandler(ctx: AppContext) {
  const apiKey = ctx.req.headers.get("X-Api-Key");

  if (apiKey !== AWS_WEBHOOKS_KEY) {
    return ctx.respond(null, STATUS_CODE.Forbidden);
  }

  const msg = await ctx.req.json();

  if (msg.source === "aws.mediaconvert") {
    await enqueue<QueueMsgMediaConvertJobState>({
      type: "mediaconvert-job-state",
      detail: msg.detail,
    }).commit();
  }

  return ctx.respond();
}
