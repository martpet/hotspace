import { deleteCookie, getCookies, type StatusCode } from "@std/http";
import { FLASH_COOKIE, REDIRECT_STATUS_CODES } from "../util/consts.ts";
import type { Middleware } from "../util/types.ts";

export const flashMiddleware: Middleware = async (ctx, next) => {
  const encodedFlash = getCookies(ctx.req.headers)[FLASH_COOKIE];

  if (encodedFlash) {
    ctx.flash = JSON.parse(decodeURIComponent(encodedFlash));
  }

  const resp = await next();
  const isRedirect = REDIRECT_STATUS_CODES.includes(resp.status as StatusCode);

  if (encodedFlash && !isRedirect) {
    deleteCookie(resp.headers, FLASH_COOKIE, { path: "/" });
  }

  return resp;
};
