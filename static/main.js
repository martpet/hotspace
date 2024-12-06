const isServiceWorkerScope = typeof ServiceWorkerGlobalScope !== "undefined";

export const GENERAL_ERR_MSG = "Oops, something went wrong, try again!";
export const SESSION_EXPIRED_ERR_MSG = "Your session has expired!";

export const {
  deviceType,
  osName,
  browserName,
} = isServiceWorkerScope ? {} : document.documentElement.dataset;

// =====================
// Service Worker Reg
// =====================

if (
  !isServiceWorkerScope &&
  browserName !== "Firefox" // https://caniuse.com/mdn-javascript_statements_import_service_worker_support
) {
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
// Fetch Monkey Patch
// =====================

if (!isServiceWorkerScope) {
  const { fetch: originalFetch } = window;

  window.fetch = async (...args) => {
    const resp = await originalFetch(...args);
    check401Resp(resp);
    return resp;
  };

  function check401Resp(resp) {
    if (resp.status === 401 && location.host === new URL(resp.url).host) {
      alert(SESSION_EXPIRED_ERR_MSG);
      location.reload();
    }
  }
}

// =====================
// WebAuthn Auth flow
// =====================

if (!isServiceWorkerScope) {
  const button = document.querySelector(".request-credential");

  function setInProgress(inProgrss) {
    button.disabled = inProgrss;
    button.classList.toggle("spinner", inProgrss);
  }

  function showError(msg) {
    alert(msg);
    setInProgress(false);
  }

  button?.addEventListener("click", async () => {
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
      const verified = await verify(credential);
      if (verified) {
        location.reload();
      } else {
        showError("Sign in failed!");
      }
    } catch (err) {
      showError(GENERAL_ERR_MSG);
      console.error(err);
    }
  });

  async function createPubkeyOptions() {
    const resp = await fetch("/auth/cred-request-options", { method: "post" });
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
    const resp = await fetch("/auth/cred-request-verify", {
      method: "post",
      body: JSON.stringify(assertion),
    });
    if (!resp.ok) {
      let errMsg = `Credential assertion verification error`;
      const respText = await resp.text();
      if (respText) errMsg = `${errMsg}: ${respText}`;
      throw new Error(errMsg);
    }
    return (await resp.json()).verified;
  }
}

// =====================
// WebAuthn Reg flow
// =====================

if (!isServiceWorkerScope) {
  const form = document.getElementById("create-credential");
  const button = form?.querySelector("button");
  const usernameField = document.getElementById("username");
  const errorEl = form?.nextElementSibling;
  const isNewAccount = !!usernameField;

  const generalRegFlowErrorMsg = isNewAccount
    ? "Registration was not completed!"
    : "Passkey was not created!";

  function setInProgress(inProgrss) {
    if (usernameField) usernameField.disabled = inProgrss;
    button.disabled = inProgrss;
    button.classList.toggle("spinner", inProgrss);
  }

  function setError(msg) {
    errorEl.textContent = msg;
    if (msg) setInProgress(false);
  }

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    setInProgress(true);
    setError("");
    const username = usernameField?.value;
    let publicKeyOptions;
    let credential;

    try {
      publicKeyOptions = await createPubkeyOptions(username);
      if (publicKeyOptions.errorMsg) {
        setError(publicKeyOptions.errorMsg);
        return;
      }
    } catch (err) {
      setError(GENERAL_ERR_MSG);
      console.error(err);
      return;
    }
    try {
      credential = await navigator.credentials.create({
        publicKey: publicKeyOptions,
      });
    } catch (err) {
      if (err.name === "InvalidStateError") {
        setError("A passkey already exists on this device!");
      } else {
        setError(generalRegFlowErrorMsg);
      }
      console.error(err);
      return;
    }
    try {
      const verified = await verify(credential);
      if (verified) {
        location.reload();
      } else {
        setError(GENERAL_ERR_MSG);
      }
    } catch (err) {
      setError(GENERAL_ERR_MSG);
      console.error(err);
      return;
    }
  });

  async function createPubkeyOptions(username) {
    const resp = await fetch("/auth/cred-creation-options", {
      method: "post",
      body: username,
    });
    if (!resp.ok) {
      const errorMsg = await resp.text();
      if (errorMsg) return { errorMsg };
      throw new Error("Pubkey creation options error");
    }
    const data = await resp.json();
    data.challenge = decodeBase64Url(data.challenge);
    data.user.id = new TextEncoder().encode(data.user.id);
    data.excludeCredentials = data.excludeCredentials.map((item) => ({
      ...item,
      id: decodeBase64Url(item.id),
    }));
    return data;
  }

  async function verify(credential) {
    const attestation = {
      type: credential.type,
      pubKey: encodeBase64(credential.response.getPublicKey()),
      authData: encodeBase64(credential.response.getAuthenticatorData()),
      clientDataJson: encodeBase64(credential.response.clientDataJSON),
    };
    const resp = await fetch("/auth/cred-creation-verify", {
      method: "post",
      body: JSON.stringify(attestation),
    });
    if (!resp.ok) {
      throw new Error("Credential attestation verification error");
    }
    return (await resp.json()).verified;
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
  if (pushSubLockSignal.get()) return;
  pushSubLockSignal.set(true);

  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }
  if (Notification.permission !== "granted") {
    pushSubLockSignal.set(false);
    return;
  }
  db ??= await import("$db");
  let subscriber = await db.getSubscriber();
  let pushSub = forceNew ? undefined : await getPushSub();

  if (!pushSub) {
    const reg = isServiceWorkerScope
      ? self.registration
      : await navigator.serviceWorker.ready;

    const vapidKey = await fetch("/vapid").then((resp) => resp.json());

    pushSub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: decodeBase64Url(vapidKey),
    });
  }
  if (!subscriber || !equalPushSubs(subscriber.pushSub, pushSub)) {
    subscriber = await postSubscriber({ db, subscriber, pushSub });
  }
  pushSubLockSignal.set(false);
  return subscriber;
}

export async function syncPushSub({ db } = {}) {
  if (browserName === "Firefox") { // https://caniuse.com/mdn-javascript_statements_import_service_worker_support
    return;
  }
  if (pushSubLockSignal.get()) {
    return;
  }
  pushSubLockSignal.set(true);
  db ??= await import("$db");
  const subscriber = await db.getSubscriber();
  if (!subscriber) {
    pushSubLockSignal.set(false);
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
    pushSubLockSignal.set(false);
  }
}

async function postSubscriber({ db, subscriber, pushSub = null }) {
  const resp = await fetch("/subscribers", {
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
// Chat Lazy Loading
// =====================

export const chatMsgsRendered = Promise.withResolvers();

if (!isServiceWorkerScope) {
  const rootEl = document.getElementById("chat_lazy_root");
  if (!rootEl) {
    chatMsgsRendered.resolve();
  } else {
    const spaceId = rootEl.dataset.spaceId;
    const resp = await fetch(`/chat_lazy_load/${spaceId}`);
    rootEl.outerHTML = await resp.text();
    chatMsgsRendered.resolve();
  }
}

// =====================
// Utils
// =====================

function encodeBase64(data) {
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

export function createSignal(initialValue) {
  let value = initialValue;
  let prevValue = undefined;
  const listeners = new Set();
  const notify = () => listeners.forEach((fn) => fn(value, prevValue));
  return {
    get: () => value,
    set: (newValue) => {
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
