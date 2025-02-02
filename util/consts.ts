import { DAY, WEEK } from "@std/datetime";
import { assert } from "jsr:@std/assert@0.224/assert";
import { prodKvEntry } from "./kv/kv.ts";

export const isProd = prodKvEntry.value === true;

export const GENERAL_ERR_MSG = "Oops, something went wrong, try again!";
export const SESSION_TIMEOUT = WEEK * 4;
export const CHAT_SUB_WITHOUT_PUSH_SUB_EXPIRES = WEEK * 2;
export const SAVED_UPLOAD_EXPIRES = DAY * 7;

export const PUSH_SUB_HOSTS = [
  "fcm.googleapis.com",
  "google.com", // chrome canary
  "push.services.mozilla.com",
  "push.apple.com",
  "notify.windows.com",
];

const env = Deno.env.toObject();
assert(env.ADMIN_EMAIL);
assert(env.VAPID_KEYS);
export const { VAPID_KEYS, ADMIN_EMAIL } = env;

// =====================
// AWS
// =====================

assert(env.AWS_REGION);
export const { AWS_REGION } = env;

if (isProd) {
  assert(env.AWS_ACCESS_KEY_ID_PROD);
  assert(env.AWS_SECRET_ACCESS_KEY_PROD);
  assert(env.INODES_BUCKET_PROD);
} else {
  assert(env.AWS_ACCESS_KEY_ID_DEV);
  assert(env.AWS_SECRET_ACCESS_KEY_DEV);
  assert(env.INODES_BUCKET_DEV);
}

export const AWS_CREDENTIALS = {
  accessKeyId: isProd ? env.AWS_ACCESS_KEY_ID_PROD : env.AWS_ACCESS_KEY_ID_DEV,
  secretAccessKey: isProd
    ? env.AWS_SECRET_ACCESS_KEY_PROD
    : env.AWS_SECRET_ACCESS_KEY_DEV,
};

export const INODES_BUCKET = isProd
  ? env.INODES_BUCKET_PROD
  : env.INODES_BUCKET_DEV;

export const S3_ACCELERATE_ENDPOINT = "s3-accelerate.amazonaws.com";

export const INODES_BUCKET_URL =
  `https://${INODES_BUCKET}.${S3_ACCELERATE_ENDPOINT}`;
