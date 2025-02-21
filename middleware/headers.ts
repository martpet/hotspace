import { HEADER } from "@std/http";
import { extension } from "@std/media-types";
import {
  ASSETS_CLOUDFRONT_URL,
  INODES_BUCKET_URL,
  INODES_CLOUDFRONT_URL,
} from "../util/consts.ts";
import type { AppMiddleware } from "../util/types.ts";

export const headersMiddleware: AppMiddleware = async (ctx, next) => {
  if (ctx.url.pathname === "/static/service_worker.js") {
    ctx.resp.headers.set("Service-Worker-Allowed", "/");
  }

  const resp = await next();

  const ext = extension(resp.headers.get(HEADER.ContentType) || "");

  if (ext === "html") {
    const csp = [
      `default-src 'self' ${INODES_CLOUDFRONT_URL} ${ASSETS_CLOUDFRONT_URL}`,
      `connect-src 'self' ${INODES_BUCKET_URL}`,
      `script-src 'self' ${ASSETS_CLOUDFRONT_URL} 'nonce-${ctx.scpNonce}'`,
    ];
    resp.headers.set("Content-Security-Policy", csp.join(";"));
  }

  return resp;
};
