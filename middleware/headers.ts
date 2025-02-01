import { INODES_BUCKET_TA_URL, INODES_BUCKET_URL } from "../util/consts.ts";
import type { AppMiddleware } from "../util/types.ts";

export const headersMiddleware: AppMiddleware = (ctx, next) => {
  if (ctx.url.pathname === "/static/service_worker.js") {
    ctx.resp.headers.set("Service-Worker-Allowed", "/");
  }

  ctx.resp.headers.set(
    "Content-Security-Policy",
    `default-src 'self' ${INODES_BUCKET_URL} ${INODES_BUCKET_TA_URL}; script-src 'self' 'nonce-${ctx.scpNonce}';`,
  );

  return next();
};
