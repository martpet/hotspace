import {
  CREDENTIAL_REQUEST_SESSION_COOKIE,
  SESSION_COOKIE,
  verifyAssertion,
} from "$webauthn";
import { deleteCookie, getCookies, setCookie, STATUS_CODE } from "@std/http";
import { ulid } from "@std/ulid";
import { SESSION_TIMEOUT } from "../../util/consts.ts";
import { kv } from "../../util/kv/kv.ts";
import { getPasskeyById, setPasskey } from "../../util/kv/passkeys.ts";
import { setSession } from "../../util/kv/sessions.ts";
import type { AppContext, Session } from "../../util/types.ts";

export default async function credentialRequestVerifyHandler(ctx: AppContext) {
  deleteCookie(ctx.resp.headers, CREDENTIAL_REQUEST_SESSION_COOKIE, {
    path: "/",
  });

  const challenge =
    getCookies(ctx.req.headers)[CREDENTIAL_REQUEST_SESSION_COOKIE];

  if (!challenge) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  const assertion = await ctx.req.json();

  if (!assertion) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  const passkeyEntry = await getPasskeyById(assertion.credId);
  const passkey = passkeyEntry.value;

  if (!passkey) {
    return ctx.respond(null, STATUS_CODE.Forbidden);
  }

  const authData = await verifyAssertion({
    assertion,
    pubKey: passkey.pubKey,
    currentCounter: passkey.counter,
    expectedChallenge: challenge,
    expectedOrigin: ctx.url.origin,
    expectedRpId: ctx.url.hostname,
  });

  if (!authData) {
    return ctx.respond(null, STATUS_CODE.Forbidden);
  }

  passkey.counter = authData.counter;
  passkey.lastUsedAt = new Date();

  const session: Session = {
    id: ulid(),
    userId: passkey.userId,
    credId: passkey.credId,
  };

  const atomic = kv.atomic();
  atomic.check(passkeyEntry);
  setPasskey(passkey, atomic);
  setSession(session, atomic);

  const { ok } = await atomic.commit();

  if (!ok) {
    return ctx.respond(null, STATUS_CODE.Conflict);
  }

  setCookie(ctx.resp.headers, {
    name: SESSION_COOKIE,
    value: session.id,
    maxAge: SESSION_TIMEOUT / 1000,
    path: "/",
    secure: true,
    httpOnly: true,
  });

  return ctx.json({ verified: true });
}
