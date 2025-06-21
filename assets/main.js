export const isServiceWorker = typeof ServiceWorkerGlobalScope !== "undefined";

export const {
  isDev,
  deviceType,
  osName,
  browserName,
  canUseServiceWorker,
  serviceWorkerPath,
  userUsername,
} = isServiceWorker ? {} : document.documentElement.dataset;

export const GENERAL_ERR_MSG = "Oops, something went wrong, try again!";
export const SESSION_EXPIRED_ERR_MSG = "Your session has expired!";

const locationUrl = new URL(location);
const urlParamFrom = locationUrl.searchParams.get("from");

// =====================
// Remove 'from' url param
// =====================

if (urlParamFrom) {
  locationUrl.searchParams.delete("from");
  history.replaceState(null, "", locationUrl);
}

// =====================
// Window Events
// =====================

addEventListener("beforeunload", () => {
  document.getElementById("flash")?.remove();
});

addEventListener("click", ({ target }) => {
  const dataset = target.dataset;
  const commandfor = target.getAttribute("commandfor");

  if (dataset.click) {
    document.getElementById(dataset.click).click();
  }

  // https://caniuse.com/mdn-html_elements_button_commandfor
  if (commandfor && typeof target.commandForElement === "undefined") {
    const command = target.getAttribute("command");
    if (command === "show-modal")
      document.getElementById(commandfor).showModal();
  }
});

// =====================
// Service Worker Reg
// =====================

if (!isServiceWorker && canUseServiceWorker) {
  navigator.serviceWorker.getRegistration().then((reg) => {
    if (!reg) {
      navigator.serviceWorker.register(serviceWorkerPath, {
        type: "module",
        scope: "/",
      });
    }
  });
}

// =====================
// Patch Fetch
// =====================

if (!isServiceWorker) {
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

if (!isServiceWorker) {
  initLoginButtons();
}

function initLoginButtons() {
  const buttons = document.querySelectorAll(".login-button");
  if (!buttons.length) return;

  for (const btn of buttons) {
    btn.addEventListener("click", async () => {
      renderProgress(true);
      try {
        const ok = await authenticate();
        if (ok) {
          location.reload();
        } else {
          renderProgress(false);
        }
      } catch (err) {
        renderProgress(false);
        alert(err.message);
      }
    });
  }

  function renderProgress(flag) {
    for (const btn of buttons) {
      btn.disabled = flag;
      btn.classList.toggle("spinner", flag);
    }
  }
}

export async function authenticate() {
  const publicKey = await createAuthPubKeyOptions();
  const credential = await getAuthCredential(publicKey);
  if (credential) return verifyAuthCredential(credential);
}

async function createAuthPubKeyOptions() {
  const resp = await fetch("/auth/credential-request-options", {
    method: "post",
  });
  if (!resp.ok) {
    console.error(`Fetch pubkey options resp status: ${resp.status}`);
    throw new Error(GENERAL_ERR_MSG);
  }
  const data = await resp.json();
  data.challenge = decodeBase64Url(data.challenge);
  return data;
}

async function getAuthCredential(publicKey) {
  try {
    return await navigator.credentials.get({ publicKey });
  } catch (err) {
    console.error(err);
    if (!["NotAllowedError", "AbortError"].includes(err.name)) {
      throw new Error(GENERAL_ERR_MSG);
    }
  }
}

async function verifyAuthCredential(credential) {
  const assertion = {
    credId: credential.id,
    type: credential.type,
    signature: encodeBase64(credential.response.signature),
    authData: encodeBase64(credential.response.authenticatorData),
    clientDataJson: encodeBase64(credential.response.clientDataJSON),
  };
  const resp = await fetch("/auth/credential-request-verify", {
    method: "post",
    body: JSON.stringify(assertion),
  });
  if (!resp.ok) {
    const data = await resp.json();
    throw new Error(data?.error || GENERAL_ERR_MSG);
  }
  return true;
}

// =====================
// Push Subscriptions
// =====================

function importDb() {
  const path = isServiceWorker ? "./db.js" : "$db";
  return import(path);
}

export const pushSubLockSignal = createSignal(false);

export async function getPushSub() {
  const reg = isServiceWorker
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
  const db = await importDb();
  let subscriber = await db.getSubscriber();
  let pushSub = forceNew ? undefined : await getPushSub();

  if (!pushSub) {
    const reg = isServiceWorker
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
  if (!subscriber || isSubscriberChanged(subscriber, pushSub)) {
    subscriber = await postSubscriber({ subscriber, pushSub });
  }
  pushSubLockSignal.value = false;
  return subscriber;
}

export async function syncSubscriber() {
  if (!canUseServiceWorker) return;
  if (pushSubLockSignal.value) return;

  pushSubLockSignal.value = true;
  const db = await importDb();
  const subscriber = await db.getSubscriber();
  if (!subscriber) {
    pushSubLockSignal.value = false;
    return;
  }
  const pushSub = await getPushSub();
  const granted = Notification.permission === "granted";
  const revoked = !granted && subscriber.pushSub;
  const restored = granted && !subscriber.pushSub && pushSub;
  const changed = isSubscriberChanged(subscriber, pushSub);
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
  const db = await importDb();
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
  } else if (resp.status === 422) {
    await db.deleteSubscriber();
  }
}

function isSubscriberChanged(subscriber, pushSub) {
  return (
    (subscriber.pushSub?.endpoint || null) !== (pushSub?.endpoint || null) ||
    userUsername !== subscriber.username
  );
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
  locationUrl.searchParams.set("partial", id);
  const html = await fetch(locationUrl).then((resp) => resp.text());
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

export function flashNow(flash) {
  if (typeof flash === "string") flash = { msg: flash };
  const classes = ["flash", "alert", flash.type || "success"];
  const html = `
    <dialog open class="${classes.join(" ")}">
      <form method="dialog">
        ${flash.msg}
        <button>X</button>
      </form>
    </dialog>
  `;
  const insertAfterEl =
    Array.from(document.querySelectorAll(".flash")).at(-1) ||
    document.getElementById("page-header");

  if (insertAfterEl) {
    insertAfterEl.insertAdjacentHTML("afterend", html);
  } else {
    document.body.insertAdjacentHTML("afterbegin", html);
  }
}

export function createSignal(initialValue, options = {}) {
  let value = initialValue;
  let prevValue = undefined;
  const listeners = new Set();
  const { equalityFn = (a, b) => a !== b, asyncNotify = false } = options;

  const notify = () => {
    const notifyListeners = () => {
      listeners.forEach((fn) => {
        try {
          fn(value, prevValue);
        } catch (error) {
          console.error("Signal listener error:", error);
        }
      });
    };
    if (asyncNotify) {
      setTimeout(notifyListeners);
    } else {
      notifyListeners();
    }
  };

  return {
    get value() {
      return value;
    },
    set value(newValue) {
      if (equalityFn(value, newValue)) {
        prevValue = value;
        value = newValue;
        notify();
      }
    },
    subscribe: (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    batch: (updater) => {
      const oldValue = value;
      updater();
      if (equalityFn(value, oldValue)) {
        notify();
      }
    },
  };
}
