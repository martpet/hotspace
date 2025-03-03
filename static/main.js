const isServiceWorkerScope = typeof ServiceWorkerGlobalScope !== "undefined";

const dataAttr = isServiceWorkerScope ? {} : document.documentElement.dataset;

export const {
  deviceType,
  osName,
  browserName,
  canUserServiceWorker,
} = dataAttr;

export const GENERAL_ERR_MSG = "Oops, something went wrong, try again!";
export const SESSION_EXPIRED_ERR_MSG = "Your session has expired!";

// =====================
// Service Worker Reg
// =====================

if (!isServiceWorkerScope && canUserServiceWorker) {
  navigator.serviceWorker.getRegistration().then((reg) => {
    if (!reg) {
      navigator.serviceWorker.register("/static/service_worker.js", {
        type: "module",
        scope: "/",
      });
    }
  });
}

// =====================
// Fetch Patch
// =====================

if (!isServiceWorkerScope) {
  const { fetch: originalFetch } = window;

  window.fetch = async (...args) => {
    const resp = await originalFetch(...args);
    handle401(resp);
    return resp;
  };

  function handle401(resp) {
    if (resp.status === 401 && location.host === new URL(resp.url).host) {
      setFlash({ msg: "Your session has expired", type: "error" });
      location.reload();
    }
  }
}

// =====================
// WebAuthn Auth flow
// =====================

if (!isServiceWorkerScope) {
  const buttons = document.querySelectorAll(".login-button");

  buttons.forEach((btn) => {
    btn.addEventListener("click", handleButtonClick);
  });

  function setInProgress(inProgrss) {
    buttons.forEach((btn) => {
      btn.disabled = inProgrss;
      btn.classList.toggle("spinner", inProgrss);
    });
  }

  function showError(msg) {
    alert(msg);
    setInProgress(false);
  }

  async function handleButtonClick() {
    setInProgress(true);
    let publicKeyOptions;
    let credential;

    try {
      publicKeyOptions = await createPubkeyOptions();
    } catch (err) {
      showError(GENERAL_ERR_MSG);
      console.error(err);
      return;
    }
    try {
      credential = await navigator.credentials.get({
        publicKey: publicKeyOptions,
      });
    } catch (err) {
      if (
        err.name === "AbortError" || // Firefox
        err.name === "NotAllowedError"
      ) {
        setInProgress(false);
      } else {
        showError(GENERAL_ERR_MSG);
      }
      console.error(err);
      return;
    }
    try {
      const result = await verify(credential);
      if (result.verified) {
        location.reload();
      } else {
        showError(result.error || "Sign in failed!");
      }
    } catch (err) {
      showError(GENERAL_ERR_MSG);
      console.error(err);
    }
  }

  async function createPubkeyOptions() {
    const resp = await fetch("/app/auth/cred-request-options", {
      method: "post",
    });
    if (!resp.ok) {
      throw new Error("Pubkey request options creation error");
    }
    const data = await resp.json();
    data.challenge = decodeBase64Url(data.challenge);
    return data;
  }

  async function verify(credential) {
    const assertion = {
      credId: credential.id,
      type: credential.type,
      signature: encodeBase64(credential.response.signature),
      authData: encodeBase64(credential.response.authenticatorData),
      clientDataJson: encodeBase64(credential.response.clientDataJSON),
    };
    const resp = await fetch("/app/auth/cred-request-verify", {
      method: "post",
      body: JSON.stringify(assertion),
    });
    if (resp.status === 404) {
      return {
        error:
          "Your account has been deleted. Please, remove your passkey from your keychain.",
      };
    } else if (!resp.ok) {
      let errMsg = `Credential assertion verification error`;
      const respText = await resp.text();
      if (respText) errMsg = `${errMsg}: ${respText}`;
      throw new Error(errMsg);
    }
    return resp.json();
  }
}

// =====================
// Push Subscription
// =====================

export const pushSubLockSignal = createSignal(false);

export async function getPushSub() {
  const reg = isServiceWorkerScope
    ? self.registration
    : await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

export async function createPushSub({ db, forceNew } = {}) {
  if (pushSubLockSignal.value) return;
  pushSubLockSignal.value = true;

  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }
  if (Notification.permission !== "granted") {
    pushSubLockSignal.value = false;
    return;
  }
  db ??= await import("$db");
  let subscriber = await db.getSubscriber();
  let pushSub = forceNew ? undefined : await getPushSub();

  if (!pushSub) {
    const reg = isServiceWorkerScope
      ? self.registration
      : await navigator.serviceWorker.ready;

    const vapidKey = await fetch("/app/push-subs/vapid").then((resp) =>
      resp.json()
    );

    pushSub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: decodeBase64Url(vapidKey),
    });
  }
  if (!subscriber || !equalPushSubs(subscriber.pushSub, pushSub)) {
    subscriber = await postSubscriber({ db, subscriber, pushSub });
  }
  pushSubLockSignal.value = false;
  return subscriber;
}

export async function syncPushSub({ db } = {}) {
  if (!canUserServiceWorker) return;
  if (pushSubLockSignal.value) return;

  pushSubLockSignal.value = true;
  db ??= await import("$db");
  const subscriber = await db.getSubscriber();
  if (!subscriber) {
    pushSubLockSignal.value = false;
    return;
  }
  const pushSub = await getPushSub();
  const granted = Notification.permission === "granted";
  const revoked = !granted && subscriber.pushSub;
  const restored = granted && !subscriber.pushSub && pushSub;
  const changed = !equalPushSubs(subscriber.pushSub, pushSub);
  try {
    if (revoked || restored || changed) {
      await postSubscriber({
        db,
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

async function postSubscriber({ db, subscriber, pushSub = null }) {
  const resp = await fetch("/app/push-subs/subscribers", {
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

// =====================
// Utils
// =====================

export function encodeBase64(data) {
  return btoa(String.fromCharCode(...new Uint8Array(data)));
}

export function decodeBase64Url(base64Url) {
  const base64 = base64Url.replaceAll("-", "+").replaceAll("_", "/");
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

export function collapseLineBreaks(text, maxBreaks) {
  const regex = new RegExp(`(\\n{${maxBreaks},})`, "g");
  const replacement = "\n".repeat(maxBreaks);
  return text.replace(regex, replacement).trim();
}

export async function replaceFragment(id) {
  const url = new URL(location.href);
  url.searchParams.set("fragment", id);
  const html = await fetch(url).then((resp) => resp.text());
  document.getElementById(id).outerHTML = html;
}

export function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

export function throttle(func, limit) {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      func.apply(this, args);
    }
  };
}

export function setFlash(flash) {
  if (typeof flash === "string") flash = { msg: flash, type: "success" };
  const encoded = encodeURIComponent(JSON.stringify(flash));
  document.cookie = `flash=${encoded};path=/`;
}

export function setFromCookie(str) {
  document.cookie = `from=${str};path=/`;
}

export function createSignal(initialValue) {
  let value = initialValue;
  let prevValue = undefined;
  const listeners = new Set();
  const notify = () =>
    setTimeout(() => listeners.forEach((fn) => fn(value, prevValue)));
  return {
    get value() {
      return value;
    },
    set value(newValue) {
      if (value !== newValue) {
        prevValue = value;
        value = newValue;
        notify();
      }
    },
    subscribe: (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}
