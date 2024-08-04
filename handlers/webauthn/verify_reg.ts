import { verifyRegResponse } from "$webauthn";
import { deleteCookie, getCookies, setCookie } from "@std/http";
import { ulid } from "@std/ulid";
import { REG_SESSION_COOKIE, SESSION_COOKIE } from "../../utils/consts.ts";
import {
  kv,
  KV_KEYS,
  setPasskey,
  setSession,
  setUser,
} from "../../utils/db.ts";
import type {
  Context,
  Passkey,
  RegSession,
  Session,
  User,
} from "../../utils/types.ts";

export default async function verifyRegHandler(ctx: Context) {
  const { req, url } = ctx;

  if (req.method !== "POST") {
    return new Response(null, { status: 405, headers: { allow: "POST" } });
  }

  const headers = new Headers();
  deleteCookie(headers, REG_SESSION_COOKIE, { path: "/" });
  const negativeResponse = new Response(null, { status: 401, headers });
  const regSessionId = getCookies(req.headers)[REG_SESSION_COOKIE];

  if (!regSessionId) {
    return negativeResponse;
  }

  const regSession =
    (await kv.get<RegSession>(KV_KEYS.regSessions(regSessionId))).value;

  if (!regSession) {
    return negativeResponse;
  }

  const { verified, authData } = await verifyRegResponse({
    credential: await req.json(),
    expectedChallenge: regSession.challenge,
    expectedOrigin: url.origin,
    expectedRpId: url.hostname,
  });

  if (!verified) {
    return negativeResponse;
  }

  const user: User = {
    id: ulid(),
    username: regSession.username,
  };

  const passkey: Passkey = {
    credId: authData.credentialId,
    userId: user.id,
    webauthnUserId: regSession.webauthnUserId,
    pubKey: authData.publicKey,
    backupEligible: authData.flags.be,
    backedUp: authData.flags.bs,
    counter: authData.counter,
    createdAt: new Date(),
  };

  const session: Session = {
    id: ulid(),
    userId: user.id,
  };

  const atomic = kv.atomic();
  setUser(user, atomic);
  setPasskey(passkey, atomic);
  setSession(session, atomic);
  const commit = await atomic.commit();

  if (!commit.ok) {
    return negativeResponse;
  }

  setCookie(headers, {
    name: SESSION_COOKIE,
    value: session.id,
    path: "/",
    httpOnly: true,
  });

  return new Response(null, { headers });
}
