import {
  CREDENTIAL_CREATION_SESSION_COOKIE,
  verifyAttestation,
} from "$webauthn";
import { decodeBase64 } from "@std/encoding";
import { deleteCookie, getCookies, STATUS_CODE } from "@std/http";
import { ulid } from "@std/ulid";
import { INITIAL_UPLOAD_LIMIT_BYTES } from "../../util/consts.ts";
import {
  kvKeys as getCredSessionKvKey,
} from "../../util/kv/cred_creation_sessions.ts";
import { kv } from "../../util/kv/kv.ts";
import { keys as getPassKeyKvKey, setPasskey } from "../../util/kv/passkeys.ts";
import { setSession } from "../../util/kv/sessions.ts";
import { setUser } from "../../util/kv/users.ts";
import { setSessionCookie } from "../../util/session.ts";
import type {
  AppContext,
  CredentialCreationSession,
  Passkey,
  Session,
  User,
} from "../../util/types.ts";

export default async function credentialCreationVerifyHandler(ctx: AppContext) {
  deleteCookie(ctx.resp.headers, CREDENTIAL_CREATION_SESSION_COOKIE, {
    path: "/",
  });

  const creationSessionId =
    getCookies(ctx.req.headers)[CREDENTIAL_CREATION_SESSION_COOKIE];

  if (!creationSessionId) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  const [
    { value: creationSession },
    { value: aaguidData },
  ] = await kv.getMany<[
    CredentialCreationSession,
    Record<string, string>,
  ]>([
    getCredSessionKvKey.byId(creationSessionId),
    getPassKeyKvKey.aaguidData,
  ]);

  if (!creationSession) {
    return ctx.respond(null, STATUS_CODE.Forbidden);
  }

  const attestation = await ctx.req.json();

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
      uploadCredits: {
        startBytes: 0,
        limitBytes: INITIAL_UPLOAD_LIMIT_BYTES,
      },
    };

    const session: Session = {
      id: ulid(),
      userId: newUser.id,
      credId: authData.credId,
    };

    setUser(newUser, atomic);
    setSession(session, atomic);

    setSessionCookie({
      headers: ctx.resp.headers,
      sessionId: session.id,
    });
  }

  const passkey: Passkey = {
    credId: authData.credId,
    userId,
    pubKey: decodeBase64(attestation.pubKey),
    counter: authData.counter,
    aaguid: authData.aaguid,
    aaguidLabel: aaguidData?.[authData.aaguid],
    createdAt: now,
    lastUsedAt: ctx.state.user ? undefined : now,
  };

  setPasskey(passkey, atomic);

  const { ok } = await atomic.commit();

  if (!ok) {
    return ctx.respond(null, STATUS_CODE.Conflict);
  }

  return ctx.json({ verified: true });
}
