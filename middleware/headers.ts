import type { AppMiddleware } from "../util/types.ts";

export const headersMiddleware: AppMiddleware = (ctx, next) => {
  if (ctx.url.pathname === "/static/service_worker.js") {
    ctx.respOpt.headers.set("Service-Worker-Allowed", "/");
  }
  return next();
};
