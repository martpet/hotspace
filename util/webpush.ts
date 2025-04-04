import { ApplicationServer, importVapidKeys } from "@negrel/webpush";
import { ADMIN_EMAIL, VAPID_KEYS } from "./consts.ts";
import type { PushMessage, PushSub } from "./types.ts";

export const vapidKeys = await importVapidKeys(
  JSON.parse(VAPID_KEYS),
  { extractable: false },
);

const appServer = await ApplicationServer.new({
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
