import type { AppMiddleware } from "../util/types.ts";

export const headersMiddleware: AppMiddleware = (ctx, next) => {
  if (ctx.url.pathname === "/static/service_worker.js") {
    ctx.resp.headers.set("Service-Worker-Allowed", "/");
  }

  ctx.resp.headers.set(
    "Content-Security-Policy",
    `default-src 'self'; script-src 'self' 'nonce-${ctx.scpNonce}';`,
  );

  return next();
};
