import { SESSION_TIMEOUT } from "../consts.ts";
import type { Session } from "../types.ts";
import { kv } from "./kv.ts";

const keys = {
  byId: (id: string) => ["sessions", id],
  byUser: (userId: string, id: string) => ["sessions_by_user", userId, id],
  byPasskey: (
    credId: string,
    id: string,
  ) => ["sessions_by_passkey", credId, id],
};

export function setSession(session: Session, atomic = kv.atomic()) {
  const expireIn = SESSION_TIMEOUT;
  return atomic
    .set(keys.byId(session.id), session, { expireIn })
    .set(keys.byUser(session.userId, session.id), session, { expireIn })
    .set(keys.byPasskey(session.credId, session.id), session, { expireIn });
}

export function deleteSession(session: Session, atomic = kv.atomic()) {
  return atomic
    .delete(keys.byId(session.id))
    .delete(keys.byUser(session.userId, session.id))
    .delete(keys.byPasskey(session.credId, session.id));
}

export function getSessionById(id: string) {
  return kv.get<Session>(keys.byId(id));
}

export function listSessionsByUser(userId: string) {
  const prefix = keys.byUser(userId, "").slice(0, -1);
  const iter = kv.list<Session>({ prefix });
  return Array.fromAsync(iter, (it) => it.value);
}

export function listSessionsByPasskey(credId: string) {
  const prefix = keys.byPasskey(credId, "").slice(0, -1);
  const iter = kv.list<Session>({ prefix });
  return Array.fromAsync(iter, (it) => it.value);
}
