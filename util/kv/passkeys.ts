import type { Passkey } from "../types.ts";
import { kv } from "./kv.ts";

const keys = {
  byId: (credId: string) => ["passkeys", credId],
  byUser: (
    userId: string,
    createdAt: Date,
  ) => ["passkeys_by_user", userId, +createdAt],
};

export function setPasskey(passkey: Passkey, atomic = kv.atomic()) {
  return atomic
    .set(keys.byId(passkey.credId), passkey)
    .set(keys.byUser(passkey.userId, passkey.createdAt), passkey);
}

export function deletePasskey(passkey: Passkey, atomic = kv.atomic()) {
  return atomic
    .delete(keys.byId(passkey.credId))
    .delete(keys.byUser(passkey.userId, passkey.createdAt));
}

export function getPasskeyById(credId: string) {
  return kv.get<Passkey>(keys.byId(credId));
}

export async function listPasskeysByUser(userId: string) {
  const prefix = keys.byUser(userId, new Date()).slice(0, -1);
  const iter = kv.list<Passkey>({ prefix });
  return (await Array.fromAsync(iter)).map((x) => x.value);
}