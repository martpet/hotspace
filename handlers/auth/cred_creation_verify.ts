import {
  CREDENTIAL_CREATION_SESSION_COOKIE,
  SESSION_COOKIE,
  verifyAttestation,
} from "$webauthn";
import { decodeBase64 } from "@std/encoding";
import { deleteCookie, getCookies, setCookie, STATUS_CODE } from "@std/http";
import { ulid } from "@std/ulid";
import { SESSION_TIMEOUT } from "../../util/consts.ts";
import { getCredentialCreationSession } from "../../util/db/cred_creation_sessions.ts";
import { kv } from "../../util/db/kv.ts";
import { setPasskey } from "../../util/db/passkeys.ts";
import { setSession } from "../../util/db/sessions.ts";
import { setUser } from "../../util/db/users.ts";
import type { AppContext, Passkey, Session, User } from "../../util/types.ts";

export default async function credentialCreationVerify(ctx: AppContext) {
  deleteCookie(ctx.res.headers, CREDENTIAL_CREATION_SESSION_COOKIE, {
    path: "/",
  });

  const creationSessionId =
    getCookies(ctx.req.headers)[CREDENTIAL_CREATION_SESSION_COOKIE];

  if (!creationSessionId) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  const creationSession =
    (await getCredentialCreationSession(creationSessionId)).value;

  if (!creationSession) {
    return ctx.respond(null, STATUS_CODE.Forbidden);
  }

  const attestation = await ctx.req.json();

  if (!attestation) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  const authData = await verifyAttestation({
    attestation,
    expectedChallenge: creationSession.challenge,
    expectedOrigin: ctx.url.origin,
    expectedRpId: ctx.url.hostname,
  });

  if (!authData) {
    return ctx.respond(null, STATUS_CODE.Forbidden);
  }

  const userId = ctx.state.user?.id || ulid();
  const atomic = kv.atomic();
  const now = new Date();

  if (!ctx.state.user) {
    const newUser: User = {
      id: userId,
      username: creationSession.username,
      webauthnUserId: creationSession.webauthnUserId,
    };

    const session: Session = {
      id: ulid(),
      userId: newUser.id,
      credId: authData.credId,
    };

    setUser(newUser, atomic);
    setSession(session, atomic);
    setCookie(ctx.res.headers, {
      name: SESSION_COOKIE,
      value: session.id,
      maxAge: SESSION_TIMEOUT / 1000,
      path: "/",
      secure: !ctx.isLocalhostSafari,
      httpOnly: true,
    });
  }

  const passkey: Passkey = {
    credId: authData.credId,
    userId,
    pubKey: decodeBase64(attestation.pubKey),
    counter: authData.counter,
    aaguid: authData.aaguid,
    createdAt: now,
    lastUsedAt: ctx.state.user ? undefined : now,
  };

  setPasskey(passkey, atomic);

  const commit = await atomic.commit();

  if (!commit.ok) {
    return ctx.respond(null, STATUS_CODE.InternalServerError);
  }

  return ctx.json({ verified: true });
}
