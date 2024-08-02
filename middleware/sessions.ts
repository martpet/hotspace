import { deleteCookie, getCookies } from "@std/http";
import { SESSION_COOKIE, STATIC_FILES_URL_PATTERN } from "../utils/consts.ts";
import { kv, KV_KEYS } from "../utils/db.ts";
import type { Middleware, Session, User } from "../utils/types.ts";

export const sessions: Middleware = async (ctx, next) => {
  const isStaticFileRequest =
    ctx.urlPattern.pathname === STATIC_FILES_URL_PATTERN;

  if (isStaticFileRequest) {
    return next();
  }

  const sessionId = getCookies(ctx.req.headers)[SESSION_COOKIE];

  if (!sessionId) {
    return next();
  }

  const session = (await kv.get<Session>(KV_KEYS.sessions(sessionId))).value;

  if (session) {
    ctx.state.user =
      (await kv.get<User>(KV_KEYS.users(session.userId))).value || undefined;
  }

  const resp = await next();

  if (!ctx.state.user) {
    deleteCookie(resp.headers, SESSION_COOKIE, { path: "/" });
  }

  return resp;
};
