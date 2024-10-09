import { type Handler, staticFilesHandler } from "$server";
import { SESSION_COOKIE } from "$webauthn";
import { deleteCookie, getCookies } from "@std/http";
import { getSessionById } from "../util/db/sessions.ts";
import { getUserById } from "../util/db/users.ts";
import type { AppMiddleware } from "../util/types.ts";

export const sessionMiddleware: AppMiddleware = async (ctx, next) => {
  const excludedHandlers: Handler[] = [staticFilesHandler];

  if (excludedHandlers.includes(ctx.handler)) {
    return next();
  }

  const sessionId = getCookies(ctx.req.headers)[SESSION_COOKIE];

  if (!sessionId) {
    return next();
  }

  let user = null;
  const session = (await getSessionById(sessionId)).value;

  if (session) {
    user = (await getUserById(session.userId)).value;
  }

  if (!session || !user) {
    deleteCookie(ctx.res.headers, SESSION_COOKIE, { path: "/" });
  }

  ctx.state.session = session;
  ctx.state.user = user;

  return next();
};
