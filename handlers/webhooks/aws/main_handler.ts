import { STATUS_CODE } from "@std/http";
import { AWS_WEBHOOKS_KEY } from "../../../util/consts.ts";
import type { AppContext } from "../../../util/types.ts";

import {
  handleMediaConvertJobStateChange,
  isMediaConvertJobStateChange,
} from "./media_convert_job_state_change.ts";

export async function awsWebhooksHandler(ctx: AppContext) {
  const apiKey = ctx.req.headers.get("X-Api-Key");

  if (apiKey !== AWS_WEBHOOKS_KEY) {
    return ctx.respond(null, STATUS_CODE.Unauthorized);
  }

  const event = await ctx.req.json();

  const handlers = [
    [isMediaConvertJobStateChange, handleMediaConvertJobStateChange],
  ];

  for (const [check, handler] of handlers) {
    if (check(event)) {
      await handler(event);
      break;
    }
  }

  return ctx.respond();
}
