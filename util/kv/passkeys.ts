import type { Passkey } from "../types.ts";
import { kv } from "./kv.ts";

export const keys = {
  byId: (credId: string) => ["passkeys", credId],
  byUser: (
    userId: string,
    createdAt: Date,
  ) => ["passkeys_by_user", userId, +createdAt],
  aaguidData: ["aaguid_data"],
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

export function listPasskeysByUser(userId: string) {
  const prefix = keys.byUser(userId, new Date()).slice(0, -1);
  const iter = kv.list<Passkey>({ prefix });
  return Array.fromAsync(iter, (it) => it.value);
}

export function setPasskeysAaguidData(data: Record<string, string>) {
  return kv.set(keys.aaguidData, data);
}

export function getPasskeysAaguidData(consistency?: Deno.KvConsistencyLevel) {
  return kv.get<Record<string, string>>(keys.aaguidData, { consistency });
}
