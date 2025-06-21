import type { AppMiddleware } from "../util/types.ts";

export const stateMiddleware: AppMiddleware = (ctx, next) => {
  // https://caniuse.com/mdn-javascript_statements_import_service_worker_support
  ctx.state.canUseServiceWorker = ctx.userAgent.browser.name !== "Firefox";

  return next();
};
