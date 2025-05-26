import { SESSION_COOKIE } from "$webauthn";
import { setCookie } from "@std/http";
import { decodeTime } from "@std/ulid";
import { SESSION_TIMEOUT } from "./consts.ts";
import type { Session } from "./types.ts";

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

export function isSessionFresh(session: Session, maxAge: number) {
  return Date.now() - decodeTime(session.id) <= maxAge;
}
