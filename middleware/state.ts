import { deleteCookie, getCookies } from "@std/http";
import type { AppMiddleware } from "../util/types.ts";

export const stateMiddleware: AppMiddleware = (ctx, next) => {
  const cookies = getCookies(ctx.req.headers);

  if (cookies.kvStrong) {
    ctx.state.kvStrong = true;
    deleteCookie(ctx.resp.headers, "kvStrong", { path: "/" });
  }

  // https://caniuse.com/mdn-javascript_statements_import_service_worker_support
  ctx.state.canUseServiceWorker = ctx.userAgent.browser.name !== "Firefox";

  return next();
};
