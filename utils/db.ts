export const kv = await Deno.openKv();

export const kvKeys = {
  users: (userId: string) => ["users", userId],
  usersByUsername: (username: string) => ["users_by_username", username],
  sessions: (sessionId: string) => ["sessions", sessionId],
  sessionsByUser: (
    userId: string,
    sessionId: string,
  ) => ["sessions_by_user", userId, sessionId],
  regSessions: (regSessionId: string) => ["reg_sessions", regSessionId],
  passkeys: (credId: string) => ["passkeys", credId],
  passkeysByUser: (userId: string) => ["passkeys", userId],
};

export interface User {
  id: string;
  username: string;
}

export interface Session {
  id: string;
  userId: string;
  createdAt: Date;
}

export interface Passkey {
  credId: string;
  userId: string;
  webauthnUserId: string;
  pubKey: Uint8Array;
  backupEligible: boolean;
  backedUp: boolean;
  counter: number;
  createdAt: Date;
  lastUsed: Date;
}

export function setUser(user: User, atomic = kv.atomic()) {
  return atomic
    .set(kvKeys.users(user.id), user)
    .set(kvKeys.usersByUsername(user.username), user);
}

export function setSession(session: Session, atomic = kv.atomic()) {
  return atomic
    .set(kvKeys.sessions(session.id), session)
    .set(kvKeys.sessionsByUser(session.userId, session.id), session);
}

export function setPasskey(passkey: Passkey, atomic = kv.atomic()) {
  return atomic
    .set(kvKeys.passkeys(passkey.credId), passkey)
    .set(kvKeys.passkeysByUser(passkey.userId), passkey);
}
