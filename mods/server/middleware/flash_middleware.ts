import { deleteCookie, getCookies, type StatusCode } from "@std/http";
import { FLASH_COOKIE, REDIRECT_STATUS_CODES } from "../util/consts.ts";
import type { Middleware } from "../util/types.ts";

export const flashMiddleware: Middleware = async (ctx, next) => {
  const flash = getCookies(ctx.req.headers)[FLASH_COOKIE];

  if (flash) {
    ctx.flash = JSON.parse(decodeURIComponent(flash));
  }

  const resp = await next();
  const isRedirect = REDIRECT_STATUS_CODES.includes(resp.status as StatusCode);

  if (flash && !isRedirect) {
    deleteCookie(resp.headers, FLASH_COOKIE, { path: "/" });
  }

  return resp;
};
