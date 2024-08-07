import type { Passkey, Session, User } from "./types.ts";

export const kv = await Deno.openKv();

// deno-fmt-ignore
export const KV_KEYS = {
  users: (userId: string) => ["users", userId],
  usersByUsername: (username: string) => ["users_by_username", username],
  sessions: (sessionId: string) => ["sessions", sessionId],
  sessionsByUser: (userId: string, sessionId: string) => ["sessions_by_user", userId, sessionId],
  regSessions: (regSessionId: string) => ["reg_sessions", regSessionId],
  passkeys: (credId: string) => ["passkeys", credId],
  passkeysByUser: (userId: string) => ["passkeys", userId]
};

export function setUser(user: User, atomic = kv.atomic()) {
  return atomic
    .set(KV_KEYS.users(user.id), user)
    .set(KV_KEYS.usersByUsername(user.username), user);
}

export function setSession(session: Session, atomic = kv.atomic()) {
  return atomic
    .set(KV_KEYS.sessions(session.id), session)
    .set(KV_KEYS.sessionsByUser(session.userId, session.id), session);
}

export function deleteSession(session: Session) {
  return kv.atomic()
    .delete(KV_KEYS.sessions(session.id))
    .delete(KV_KEYS.sessionsByUser(session.userId, session.id))
    .commit();
}

export function setPasskey(passkey: Passkey, atomic = kv.atomic()) {
  return atomic
    .set(KV_KEYS.passkeys(passkey.credId), passkey)
    .set(KV_KEYS.passkeysByUser(passkey.userId), passkey);
}
