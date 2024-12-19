import { WEEK } from "@std/datetime";

export const GENERAL_ERR_MSG = "Oops, something went wrong, try again!";
export const SESSION_TIMEOUT = WEEK * 4;
export const CHAT_SUB_WITHOUT_PUSH_SUB_EXPIRES = WEEK * 2;

export const PUSH_SUB_HOSTS = [
  "fcm.googleapis.com",
  "google.com", // for chrome canary
  "push.services.mozilla.com",
  "push.apple.com",
  "notify.windows.com",
];
