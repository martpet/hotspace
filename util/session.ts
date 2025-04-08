import { SESSION_COOKIE } from "$webauthn";
import { setCookie } from "@std/http";
import { SESSION_TIMEOUT } from "./consts.ts";

interface SetSessionCookieOptions {
  headers: Headers;
  sessionId: string;
}

export function setSessionCookie(options: SetSessionCookieOptions) {
  const { headers, sessionId } = options;
  setCookie(headers, {
    name: SESSION_COOKIE,
    value: sessionId,
    path: "/",
    maxAge: SESSION_TIMEOUT / 1000,
    secure: true,
    httpOnly: true,
    sameSite: "Lax",
  });
}
