import { deleteCookie, getCookies } from "@std/http";
import { Server } from "../Server.ts";
import { FLASH_COOKIE } from "../util/consts.ts";
import type { Middleware } from "../util/types.ts";

export const flashMiddleware: Middleware = async (ctx, next) => {
  const encodedFlash = getCookies(ctx.req.headers)[FLASH_COOKIE];

  if (encodedFlash) {
    ctx.flash = JSON.parse(decodeURIComponent(encodedFlash));
  }

  const resp = await next();

  if (encodedFlash && !Server.isRedirect(resp)) {
    deleteCookie(resp.headers, FLASH_COOKIE, { path: "/" });
  }

  return resp;
};
