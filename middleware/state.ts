import type { AppMiddleware } from "../util/types.ts";

export const stateMiddleware: AppMiddleware = (ctx, next) => {
  ctx.state.canUseServiceWorker = ctx.userAgent.browser.name !== "Firefox";
  // https://caniuse.com/mdn-javascript_statements_import_service_worker_support

  return next();
};
