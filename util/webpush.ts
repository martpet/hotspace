import * as webpush from "@negrel/webpush";
import { env } from "./consts.ts";
import type { PushMessage, PushSub } from "./types.ts";

if (!env.VAPID_KEYS) {
  throw new Error("Missing `VAPID_KEYS` env var");
}

if (!env.ADMIN_EMAIL) {
  throw new Error("Missing `ADMIN_EMAIL` env var");
}

export const vapidKeys = await webpush.importVapidKeys(
  JSON.parse(env.VAPID_KEYS),
  { extractable: false },
);

const appServer = await webpush.ApplicationServer.new({
  contactInformation: "mailto:" + env.ADMIN_EMAIL,
  vapidKeys,
});

export function sendPushNotification(pushSub: PushSub, message: PushMessage) {
  return appServer.subscribe(pushSub).pushTextMessage(
    JSON.stringify(message),
    {},
  );
}

export function sendTestPushNotification(pushSub: PushSub) {
  return sendPushNotification(pushSub, {
    type: "test-notification",
  });
}
