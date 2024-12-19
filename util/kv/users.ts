import type { User } from "../types.ts";
import { kv } from "./kv.ts";

export const keys = {
  byId: (id: string) => ["users", id],
  byUsername: (username: string) => ["users_by_username", username],
};

export function setUser(user: User, atomic = kv.atomic()) {
  return atomic
    .set(keys.byId(user.id), user)
    .set(keys.byUsername(user.username), user);
}

export function getUserById(id: string) {
  return kv.get<User>(keys.byId(id));
}

export function getUserByUsername(username: string) {
  return kv.get<User>(keys.byUsername(username));
}
