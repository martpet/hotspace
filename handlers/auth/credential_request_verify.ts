import { CREDENTIAL_REQUEST_SESSION_COOKIE, verifyAssertion } from "$webauthn";
import { deleteCookie, getCookies, STATUS_CODE } from "@std/http";
import { ulid } from "@std/ulid";
import { kv } from "../../util/kv/kv.ts";
import { getPasskeyById, setPasskey } from "../../util/kv/passkeys.ts";
import { setSession } from "../../util/kv/sessions.ts";
import { setSessionCookie } from "../../util/session.ts";
import type { AppContext, Session } from "../../util/types.ts";

export default async function credentialRequestVerifyHandler(ctx: AppContext) {
  const { user } = ctx.state;

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
    const msg = "Account not found";
    return ctx.respondJson({ error: msg }, STATUS_CODE.NotFound);
  }

  if (user && user.id !== passkey.userId) {
    const msg = "You tried to sign in as another user";
    return ctx.respondJson({ error: msg }, STATUS_CODE.Forbidden);
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

  const commit = await atomic.commit();

  if (!commit.ok) {
    return ctx.respond(null, STATUS_CODE.Conflict);
  }

  setSessionCookie({
    headers: ctx.resp.headers,
    sessionId: session.id,
  });

  return ctx.respond();
}
