import { type Handler, staticFilesHandler } from "$server";
import { SESSION_COOKIE } from "$webauthn";
import { deleteCookie, getCookies } from "@std/http";
import { getSessionById } from "../util/kv/sessions.ts";
import { getUserById } from "../util/kv/users.ts";
import type { AppMiddleware } from "../util/types.ts";

export const sessionMiddleware: AppMiddleware = async (ctx, next) => {
  const skip: Handler[] = [
    staticFilesHandler,
  ];

  if (skip.includes(ctx.handler)) return next();

  const sessionId = getCookies(ctx.req.headers)[SESSION_COOKIE];

  if (!sessionId) return next();

  let user;

  const session = (await getSessionById(sessionId)).value;
  if (session) user = (await getUserById(session.userId)).value;

  if (session && user) {
    ctx.state.session = session;
    ctx.state.user = user;
  } else {
    deleteCookie(ctx.resp.headers, SESSION_COOKIE, { path: "/" });
  }

  return next();
};