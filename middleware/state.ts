import { deleteCookie } from "@std/http";
import type { AppMiddleware } from "../util/types.ts";

export const stateMiddleware: AppMiddleware = (ctx, next) => {
  if (ctx.cookies.from) {
    ctx.state.from = ctx.cookies.from;
    deleteCookie(ctx.resp.headers, "from", { path: "/" });
  }

  // https://caniuse.com/mdn-javascript_statements_import_service_worker_support
  ctx.state.canUseServiceWorker = ctx.userAgent.browser.name !== "Firefox";

  return next();
};
