import { assert } from "@std/assert";
import { DAY, WEEK } from "@std/datetime";
import { prodKvEntry } from "./kv/kv.ts";

export const isProd = prodKvEntry.value === true;

export const DEPLOYMENT_ID = Deno.env.get("DENO_DEPLOYMENT_ID");
export const IS_LOCAL_DEV = DEPLOYMENT_ID === undefined;
export const SESSION_TIMEOUT = WEEK * 4;
export const CHAT_SUB_WITHOUT_PUSH_SUB_EXPIRES = WEEK * 2;
export const SAVED_UPLOAD_EXPIRES = DAY * 7;
export const GENERAL_ERR_MSG = "Oops, something went wrong, try again!";
export const UPLOAD_DISABLED_MSG =
  "Sorry, uploading is currently disabled for all users. Try later.";
export const BUDGET_PERIOD_TYPES = ["hours", "days"] as const;

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
assert(env.APP_ADMIN);

export const { VAPID_KEYS, ADMIN_EMAIL, LOCAL_DEV_PUBLIC_URL, APP_ADMIN } = env;

// =====================
// AWS
// =====================

if (isProd) {
  assert(env.AWS_ACCESS_KEY_ID_PROD);
  assert(env.AWS_SECRET_ACCESS_KEY_PROD);
  assert(env.CLOUDFRONT_SIGNER_PRIVATE_KEY_PROD);
  assert(env.CLOUDFRONT_KEYPAIR_ID_PROD);
  assert(env.MEDIACONVERT_ROLE_PROD);
  assert(env.AWS_WEBHOOKS_KEY_PROD);
  assert(env.IMAGE_PROCESSOR_SQS_URL_PROD);
  assert(env.LIBRE_PROCESSOR_SQS_URL_PROD);
} else {
  assert(env.AWS_ACCESS_KEY_ID_DEV);
  assert(env.AWS_SECRET_ACCESS_KEY_DEV);
  assert(env.CLOUDFRONT_SIGNER_PRIVATE_KEY_DEV);
  assert(env.CLOUDFRONT_KEYPAIR_ID_DEV);
  assert(env.MEDIACONVERT_ROLE_DEV);
  assert(env.AWS_WEBHOOKS_KEY_DEV);
  assert(env.IMAGE_PROCESSOR_SQS_URL_DEV);
  assert(env.LIBRE_PROCESSOR_SQS_URL_DEV);
}

export const AWS_REGION = "us-east-1";

export const AWS_CREDENTIALS = {
  accessKeyId: isProd ? env.AWS_ACCESS_KEY_ID_PROD : env.AWS_ACCESS_KEY_ID_DEV,
  secretAccessKey: isProd
    ? env.AWS_SECRET_ACCESS_KEY_PROD
    : env.AWS_SECRET_ACCESS_KEY_DEV,
};

export const INODES_BUCKET = isProd
  ? "uploads-hotspace-lol"
  : "uploads-dev-hotspace-lol";

export const CLOUDFRONT_SIGNER_PRIVATE_KEY = isProd
  ? env.CLOUDFRONT_SIGNER_PRIVATE_KEY_PROD
  : env.CLOUDFRONT_SIGNER_PRIVATE_KEY_DEV;

export const CLOUDFRONT_KEYPAIR_ID = isProd
  ? env.CLOUDFRONT_KEYPAIR_ID_PROD
  : env.CLOUDFRONT_KEYPAIR_ID_DEV;

export const INODES_CLOUDFRONT_URL = isProd
  ? "https://uploads.hotspace.lol"
  : "https://uploads.dev.hotspace.lol";

export const ASSETS_CLOUDFRONT_URL = isProd
  ? "https://assets.hotspace.lol"
  : "";

export const MEDIACONVERT_ROLE = isProd
  ? env.MEDIACONVERT_ROLE_PROD
  : env.MEDIACONVERT_ROLE_DEV;

export const AWS_WEBHOOKS_KEY = isProd
  ? env.AWS_WEBHOOKS_KEY_PROD
  : env.AWS_WEBHOOKS_KEY_DEV;

export const IMAGE_PROCESSOR_SQS_URL = isProd
  ? env.IMAGE_PROCESSOR_SQS_URL_PROD
  : env.IMAGE_PROCESSOR_SQS_URL_DEV;

export const LIBRE_PROCESSOR_SQS_URL = isProd
  ? env.LIBRE_PROCESSOR_SQS_URL_PROD
  : env.LIBRE_PROCESSOR_SQS_URL_DEV;
