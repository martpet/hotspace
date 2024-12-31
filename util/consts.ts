import { WEEK } from "@std/datetime";
import { prodKvEntry } from "./kv/kv.ts";

export const env = Deno.env.toObject();
export const isProd = prodKvEntry.value === true;

export const GENERAL_ERR_MSG = "Oops, something went wrong, try again!";
export const SESSION_TIMEOUT = WEEK * 4;
export const CHAT_SUB_WITHOUT_PUSH_SUB_EXPIRES = WEEK * 2;

export const AWS_ACCESS_KEY_ID = isProd
  ? env.AWS_ACCESS_KEY_ID_PROD
  : env.AWS_ACCESS_KEY_ID_DEV;

export const AWS_SECRET_ACCESS_KEY = isProd
  ? env.AWS_SECRET_ACCESS_KEY_PROD
  : env.AWS_SECRET_ACCESS_KEY_DEV;

export const PUSH_SUB_HOSTS = [
  "fcm.googleapis.com",
  "google.com", // for chrome canary
  "push.services.mozilla.com",
  "push.apple.com",
  "notify.windows.com",
];
