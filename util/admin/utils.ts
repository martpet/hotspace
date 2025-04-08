import { APP_ADMIN } from "../consts.ts";
import type { User } from "../types.ts";

export function isSuperAdmin(user: User | undefined): user is User {
  return user !== undefined && user.username === APP_ADMIN;
}
