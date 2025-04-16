import { WEBAUTHN_TIMEOUT } from "$webauthn";
import type { CredentialCreationSession } from "../types.ts";
import { kv } from "./kv.ts";

export const kvKeys = {
  byId: (id: string) => ["credential_creation_sessions", id],
};

export function setCredentialCreationSession(
  creationSession: CredentialCreationSession,
) {
  return kv.set(kvKeys.byId(creationSession.id), creationSession, {
    expireIn: WEBAUTHN_TIMEOUT,
  });
}

export function getCredentialCreationSession(id: string) {
  return kv.get<CredentialCreationSession>(kvKeys.byId(id));
}
