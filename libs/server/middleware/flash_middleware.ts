import { deleteCookie, getCookies } from "@std/http";
import { FLASH_COOKIE } from "../util/consts.ts";
import type { Middleware } from "../util/types.ts";

export const flashMiddleware: Middleware = (ctx, next) => {
  const encodedFlash = getCookies(ctx.req.headers)[FLASH_COOKIE];

  if (encodedFlash) {
    ctx.flash = JSON.parse(decodeURIComponent(encodedFlash));
    deleteCookie(ctx.resp.headers, FLASH_COOKIE, { path: "/" });
  }

  return next();
};
