import { HEADER } from "@std/http/unstable-header";
import { extension } from "@std/media-types";
import {
  ASSETS_CLOUDFRONT_URL,
  INODES_CLOUDFRONT_URL,
} from "../util/consts.ts";
import type { AppMiddleware } from "../util/types.ts";

export const headersMiddleware: AppMiddleware = async (ctx, next) => {
  if (ctx.url.pathname === "/assets/service_worker.js") {
    ctx.resp.headers.set("Service-Worker-Allowed", "/");
  }

  ctx.resp.headers.set(HEADER.Vary, "Cookie");

  const resp = await next();

  if (ctx.flash) {
    resp.headers.set(HEADER.CacheControl, `Cache-Control: private, no-store`);
  }

  // =====================
  // CSP
  // =====================

  const docExt = extension(resp.headers.get(HEADER.ContentType) || "");
  const STRIPE_URL = "https://js.stripe.com";

  if (docExt === "html") {
    resp.headers.set(
      "Content-Security-Policy",
      [
        `default-src 'self' 'nonce-${ctx.scpNonce}' ${ASSETS_CLOUDFRONT_URL} ${INODES_CLOUDFRONT_URL} ${STRIPE_URL}`,
        `connect-src 'self' data: ${INODES_CLOUDFRONT_URL}`,
        `worker-src 'self' blob:`,
        `style-src 'self' 'unsafe-inline' ${ASSETS_CLOUDFRONT_URL}`,
        `media-src 'self' blob: data: ${INODES_CLOUDFRONT_URL}`,
      ].join(";"),
    );
  }

  return resp;
};
