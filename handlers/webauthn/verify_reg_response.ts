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
  AppContext,
  Passkey,
  RegSession,
  Session,
  User,
} from "../../utils/types.ts";

export default async function verifyRegResponseHandler(ctx: AppContext) {
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

  const kvRegSession = await kv.get<RegSession>(
    KV_KEYS.regSessions(regSessionId),
  );

  if (!kvRegSession.value) {
    return negativeResponse;
  }

  const { verified, authData } = await verifyRegResponse({
    credential: await req.json(),
    expectedChallenge: kvRegSession.value.challenge,
    expectedOrigin: url.origin,
    expectedRpId: url.hostname,
  });

  if (!verified) {
    return negativeResponse;
  }

  const date = new Date();

  const user: User = {
    id: ulid(),
    username: kvRegSession.value.username,
  };

  const passkey: Passkey = {
    credId: authData.credentialId,
    userId: user.id,
    webauthnUserId: kvRegSession.value.webauthnUserId,
    pubKey: authData.publicKey,
    backupEligible: authData.flags.be,
    backedUp: authData.flags.bs,
    counter: authData.counter,
    createdAt: date,
    lastUsed: date,
  };

  const session: Session = {
    id: ulid(),
    userId: user.id,
    createdAt: date,
  };

  const atomic = kv.atomic();
  setUser(user, atomic);
  setPasskey(passkey, atomic);
  setSession(session, atomic);

  const commitResult = await atomic.commit();

  if (!commitResult.ok) {
    return negativeResponse;
  }

  setCookie(headers, {
    name: SESSION_COOKIE,
    value: session.id,
    httpOnly: true,
    path: "/",
  });

  return new Response(null, { headers });
}
