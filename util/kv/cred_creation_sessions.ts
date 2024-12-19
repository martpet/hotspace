import { WEBAUTHN_TIMEOUT } from "$webauthn";
import type { CredentialCreationSession } from "../types.ts";
import { kv } from "./kv.ts";

const KV_KEY_PART = "credential_creation_sessions";

export function setCredentialCreationSession(
  session: CredentialCreationSession,
) {
  return kv.set([KV_KEY_PART, session.id], session, {
    expireIn: WEBAUTHN_TIMEOUT,
  });
}

export function getCredentialCreationSession(id: string) {
  return kv.get<CredentialCreationSession>([KV_KEY_PART, id]);
}
