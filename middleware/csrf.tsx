import { STATUS_CODE } from "@std/http";
import type { AppMiddleware } from "../util/types.ts";

export const csrfMiddleware: AppMiddleware = (ctx, next) => {
  const contentType = ctx.req.headers.get("content-type") || "text/plain";
  const originHeader = ctx.req.headers.get("origin");
  const method = ctx.req.method;

  const isSafeMethodRequest = ["GET", "HEAD"].includes(method);

  const isRequestedByFormElement = [
    "application/x-www-form-urlencoded",
    "multipart/form-data",
    "text/plain",
  ].includes(contentType);

  if (
    !isSafeMethodRequest &&
    isRequestedByFormElement &&
    originHeader !== ctx.url.origin
  ) {
    return ctx.respond(null, STATUS_CODE.Forbidden);
  }

  return next();
};
