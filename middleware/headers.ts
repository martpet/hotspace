import { INODES_BUCKET_URL, INODES_CLOUDFRONT_URL } from "../util/consts.ts";
import type { AppMiddleware } from "../util/types.ts";

export const headersMiddleware: AppMiddleware = (ctx, next) => {
  if (ctx.url.pathname === "/static/service_worker.js") {
    ctx.resp.headers.set("Service-Worker-Allowed", "/");
  }

  const csp = [
    `default-src 'self'  ${INODES_CLOUDFRONT_URL}`,
    `connect-src 'self' ${INODES_BUCKET_URL}`,
    `script-src 'self' 'nonce-${ctx.scpNonce}'`,
  ];

  ctx.resp.headers.set("Content-Security-Policy", csp.join(";"));

  return next();
};
