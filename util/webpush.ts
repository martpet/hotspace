import * as webpush from "@negrel/webpush";
import type { PushMessage, PushSub } from "./types.ts";

const { VAPID_KEYS, ADMIN_EMAIL } = Deno.env.toObject();

if (!VAPID_KEYS) {
  throw new Error("Missing `VAPID_KEYS` env var");
}

if (!ADMIN_EMAIL) {
  throw new Error("Missing `ADMIN_EMAIL` env var");
}

export const vapidKeys = await webpush.importVapidKeys(
  JSON.parse(VAPID_KEYS),
  { extractable: false },
);

const appServer = await webpush.ApplicationServer.new({
  contactInformation: "mailto:" + ADMIN_EMAIL,
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
