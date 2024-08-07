import { deleteCookie } from "@std/http";
import { SESSION_COOKIE } from "../../utils/consts.ts";
import { deleteSession } from "../../utils/db.ts";
import type { Context } from "../../utils/types.ts";

export default async function logoutHandler({ req, url, state }: Context) {
  if (req.method !== "POST") {
    return new Response(null, { status: 405, headers: { allow: "POST" } });
  }

  const resp = new Response(null, {
    status: 302,
    headers: {
      location: req.headers.get("referer") || url.origin,
    },
  });

  deleteCookie(resp.headers, SESSION_COOKIE, { path: "/" });

  const { session } = state;

  if (session) {
    await deleteSession(session);
  }

  return resp;
}
