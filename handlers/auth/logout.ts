import { SESSION_COOKIE } from "$webauthn";
import { deleteCookie } from "@std/http";
import { deleteSession } from "../../util/db/sessions.ts";
import type { AppContext } from "../../util/types.ts";

export default async function logout(ctx: AppContext) {
  const { session } = ctx.state;

  if (session) {
    await deleteSession(session).commit();
  }

  deleteCookie(ctx.res.headers, SESSION_COOKIE, { path: "/" });

  ctx.setFlash("Signed out");

  return ctx.redirectBack();
}
