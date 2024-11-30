import { type Handler, staticFilesHandler } from "$server";
import { SESSION_COOKIE } from "$webauthn";
import { accepts, deleteCookie, getCookies, STATUS_CODE } from "@std/http";
import { getSessionById } from "../util/kv/sessions.ts";
import { getUserById } from "../util/kv/users.ts";
import type { AppMiddleware } from "../util/types.ts";

export const sessionMiddleware: AppMiddleware = async (ctx, next) => {
  const skippedHandlers: Handler[] = [staticFilesHandler];

  const resp = await (async () => {
    if (skippedHandlers.includes(ctx.handler)) {
      return next();
    }

    const sessionId = getCookies(ctx.req.headers)[SESSION_COOKIE];

    if (!sessionId) {
      return next();
    }

    const session = (await getSessionById(sessionId)).value;
    let userEntry;

    if (session) {
      userEntry = await getUserById(session.userId);
    }
    if (session && userEntry?.value) {
      ctx.state.session = session;
      ctx.state.user = userEntry.value;
      ctx.state.userEntry = userEntry;
    } else {
      deleteCookie(ctx.res.headers, SESSION_COOKIE, { path: "/" });
    }

    return next();
  })();

  const unauthorizedMaybeSessionExpired =
    resp.status === STATUS_CODE.Unauthorized &&
    accepts(ctx.req).includes("text/html");

  if (unauthorizedMaybeSessionExpired) {
    ctx.setFlash({ type: "error", msg: "Your session has expired!" });
    return ctx.redirectBack();
  }

  return resp;
};
