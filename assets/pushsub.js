import {
  canUseServiceWorker,
  createSignal,
  isServiceWorkerScope,
  userUsername,
} from "$main";

export const pushSubLockSignal = createSignal(false);

export async function getPushSub() {
  const reg = isServiceWorkerScope
    ? self.registration
    : await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

export async function createPushSub({ forceNew } = {}) {
  if (pushSubLockSignal.value) return;
  pushSubLockSignal.value = true;

  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }
  if (Notification.permission !== "granted") {
    pushSubLockSignal.value = false;
    return;
  }
  const db = await import("$db");
  let subscriber = await db.getSubscriber();
  let pushSub = forceNew ? undefined : await getPushSub();

  if (!pushSub) {
    const reg = isServiceWorkerScope
      ? self.registration
      : await navigator.serviceWorker.ready;

    const vapidKey = await fetch("/push-subs/vapid").then((resp) =>
      resp.json()
    );

    pushSub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: decodeBase64Url(vapidKey),
    });
  }
  if (!subscriber || !equalPushSubs(subscriber.pushSub, pushSub)) {
    subscriber = await postSubscriber({ subscriber, pushSub });
  }
  pushSubLockSignal.value = false;
  return subscriber;
}

export async function syncPushSub() {
  if (!canUseServiceWorker) return;
  if (pushSubLockSignal.value) return;

  pushSubLockSignal.value = true;
  const db = await import("$db");
  const subscriber = await db.getSubscriber();
  if (!subscriber) {
    pushSubLockSignal.value = false;
    return;
  }
  const pushSub = await getPushSub();
  const granted = Notification.permission === "granted";
  const revoked = !granted && subscriber.pushSub;
  const restored = granted && !subscriber.pushSub && pushSub;
  const changed =
    !equalPushSubs(subscriber.pushSub, pushSub) ||
    (userUsername && !subscriber.userId);
  try {
    if (revoked || restored || changed) {
      await postSubscriber({
        subscriber,
        pushSub: revoked ? null : pushSub,
      });
    }
  } catch (err) {
    console.error(err);
  } finally {
    pushSubLockSignal.value = false;
  }
}

async function postSubscriber({ subscriber, pushSub = null }) {
  const db = await import("$db");
  const resp = await fetch("/push-subs/subscribers", {
    method: "post",
    body: JSON.stringify({
      subscriberId: subscriber?.id,
      pushSub,
    }),
  });
  if (resp.ok) {
    const newSubscriber = await resp.json();
    await db.setSubscriber(newSubscriber);
    return newSubscriber;
  }
}

function equalPushSubs(a, b) {
  return (a?.endpoint || null) === (b?.endpoint || null);
}
