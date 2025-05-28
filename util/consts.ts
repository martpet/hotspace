import { MB } from "$util";
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
export const INITIAL_UPLOAD_QUOTA = MB * 25;
export const PRICE_PER_GB_CENTS = 100;

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

export const { VAPID_KEYS, ADMIN_EMAIL, APP_ADMIN } = env;

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
  assert(env.SHARP_PROCESSOR_SQS_URL_PROD);
  assert(env.LIBRE_PROCESSOR_SQS_URL_PROD);
  assert(env.PANDOC_PROCESSOR_SQS_URL_PROD);
  assert(env.STRIPE_SECRET_PROD);
  assert(env.STRIPE_PUB_KEY_PROD);
  assert(env.ADMIN_EMAIL_ALERT_TOPIC_PROD);
  assert(env.ADMIN_SMS_ALERT_TOPIC_PROD);
} else {
  assert(env.AWS_ACCESS_KEY_ID_DEV);
  assert(env.AWS_SECRET_ACCESS_KEY_DEV);
  assert(env.CLOUDFRONT_SIGNER_PRIVATE_KEY_DEV);
  assert(env.CLOUDFRONT_KEYPAIR_ID_DEV);
  assert(env.MEDIACONVERT_ROLE_DEV);
  assert(env.AWS_WEBHOOKS_KEY_DEV);
  assert(env.SHARP_PROCESSOR_SQS_URL_DEV);
  assert(env.LIBRE_PROCESSOR_SQS_URL_DEV);
  assert(env.PANDOC_PROCESSOR_SQS_URL_DEV);
  assert(env.STRIPE_SECRET_DEV);
  assert(env.STRIPE_PUB_KEY_DEV);
  assert(env.ADMIN_EMAIL_ALERT_TOPIC_DEV);
  assert(env.ADMIN_SMS_ALERT_TOPIC_DEV);
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

export const SHARP_PROCESSOR_SQS_URL = isProd
  ? env.SHARP_PROCESSOR_SQS_URL_PROD
  : env.SHARP_PROCESSOR_SQS_URL_DEV;

export const LIBRE_PROCESSOR_SQS_URL = isProd
  ? env.LIBRE_PROCESSOR_SQS_URL_PROD
  : env.LIBRE_PROCESSOR_SQS_URL_DEV;

export const PANDOC_PROCESSOR_SQS_URL = isProd
  ? env.PANDOC_PROCESSOR_SQS_URL_PROD
  : env.PANDOC_PROCESSOR_SQS_URL_DEV;

export const STRIPE_SECRET = isProd
  ? env.STRIPE_SECRET_PROD
  : env.STRIPE_SECRET_DEV;

export const STRIPE_PUB_KEY = isProd
  ? env.STRIPE_PUB_KEY_PROD
  : env.STRIPE_PUB_KEY_DEV;

export const ADMIN_EMAIL_ALERT_TOPIC = isProd
  ? env.ADMIN_EMAIL_ALERT_TOPIC_PROD
  : env.ADMIN_EMAIL_ALERT_TOPIC_DEV;

export const ADMIN_SMS_ALERT_TOPIC = isProd
  ? env.ADMIN_SMS_ALERT_TOPIC_PROD
  : env.ADMIN_SMS_ALERT_TOPIC_DEV;
