import { deleteCookie, getCookies } from "@std/http";
import error400Handler from "../handlers/error/_404.ts";
import error500Handler from "../handlers/error/_500.ts";
import staticFilesHandler from "../handlers/static-files.ts";
import { SESSION_COOKIE } from "../utils/consts.ts";
import { kv, KV_KEYS } from "../utils/db.ts";
import type { Middleware, Session, User } from "../utils/types.ts";

export const session: Middleware = async (ctx, next) => {
  const skippedHandlers = [
    staticFilesHandler,
    error400Handler,
    error500Handler,
  ];

  if (skippedHandlers.includes(ctx.routeHandler)) {
    return next();
  }

  const sessionId = getCookies(ctx.req.headers)[SESSION_COOKIE];

  if (!sessionId) {
    return next();
  }

  const session = (await kv.get<Session>(KV_KEYS.sessions(sessionId))).value;

  if (session) {
    const user = (await kv.get<User>(KV_KEYS.users(session.userId))).value;
    ctx.state.user = user || undefined;
  }

  const resp = await next();

  if (!ctx.state.user) {
    deleteCookie(resp.headers, SESSION_COOKIE, { path: "/" });
  }

  return resp;
};
