import { deleteCookie, getCookies } from "@std/http";
import error400Handler from "../handlers/error/_404.tsx";
import error500Handler from "../handlers/error/_500.tsx";
import staticFilesHandler from "../handlers/static-files.ts";
import { SESSION_COOKIE } from "../utils/consts.ts";
import { kv, KV_KEYS } from "../utils/db.ts";
import type { Handler, Middleware, Session, User } from "../utils/types.ts";

export const session: Middleware = async (ctx, next) => {
  const skipHandlers: Handler[] = [
    staticFilesHandler,
    error400Handler,
    error500Handler,
  ];

  if (skipHandlers.includes(ctx.handler)) {
    return next();
  }

  const sessionId = getCookies(ctx.req.headers)[SESSION_COOKIE];

  if (!sessionId) {
    return next();
  }

  const session = (await kv.get<Session>(KV_KEYS.sessions(sessionId))).value;

  if (session) {
    const user = (await kv.get<User>(KV_KEYS.users(session.userId))).value;
    if (user) {
      ctx.state.user = user;
      ctx.state.session = session;
    }
  }

  const resp = await next();

  if (!ctx.state.user) {
    deleteCookie(resp.headers, SESSION_COOKIE, { path: "/" });
  }

  return resp;
};
