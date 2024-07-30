let render, html, signal, computed, effect, useEffect;

if (typeof document !== "undefined") {
  const preact = await import("/static/preact.js");
  ({ render, html, signal, computed, effect, useEffect } = preact);
}

export const REG_TIMEOUT = 1000 * 60;

export const USERNAME_CONSTRAINTS = {
  minLength: 4,
  maxLength: 30,
  pattern: "^[a-z0-9_\\-]+$",
  patternTitle: "Small letters, numbers, underscores, and hyphens.",
};

export const REG_STATUS = {
  Idle: "IDLE",
  Pending: "PENDING",
  Success: "SUCCESS",
  Aborted: "ABORTED",
  UsernameTaken: "USERNAME_TAKEN",
  WebAuthnUnsupported: "WEBAUTHN_UNSUPPORTED",
  AuthenticatorError: "AUTHENTICATOR_ERROR",
  GeneralError: "GENERAL_ERROR",
};

const DEFAULT_REG_STATUS = typeof PublicKeyCredential === "undefined"
  ? REG_STATUS.WebAuthnUnsupported
  : REG_STATUS.Idle;

const REG_STATUS_BY_ERROR = {
  AbortError: REG_STATUS.Aborted,
  NotAllowedError: REG_STATUS.AuthenticatorError,
};

const REG_ERROR_MSG = {
  [REG_STATUS.UsernameTaken]: "Username is already registered.",
  [REG_STATUS.WebAuthnUnsupported]: "Your browser doesn't support Passkeys.",
  [REG_STATUS.Aborted]: "Registration was canceled.",
  [REG_STATUS.AuthenticatorError]: "Registration was not completed.",
  [REG_STATUS.GeneralError]: "Something went wrong!",
};

let abortController, regStatus, regErrorMsg, regUsername, regInProgress;

export async function initRegForm(rootElId) {
  regStatus = signal(DEFAULT_REG_STATUS);
  regUsername = signal();
  regErrorMsg = computed(computeRegErrorMsg);
  regInProgress = computed(computeRegInProgress);
  effect(regSuccessEffect);
  render(html`<${RegForm} />`, document.getElementById(rootElId));
}

function computeRegErrorMsg() {
  return REG_ERROR_MSG[regStatus.value];
}

function computeRegInProgress() {
  return [REG_STATUS.Pending, REG_STATUS.Success].includes(regStatus.value);
}

function regSuccessEffect() {
  if (regStatus.value === REG_STATUS.Success) {
    location.hostname = regUsername.value + "." + location.hostname;
  }
}

function RegForm() {
  return html`
    <form class="reg-form" onSubmit=${submitReg}>
      <fieldset disabled=${regInProgress}>
        <label for="username">Username:</label>
        <input
          id="username"
          type="text"
          minlength="${USERNAME_CONSTRAINTS.minLength}"
          maxlength="${USERNAME_CONSTRAINTS.maxLength}"
          pattern="${USERNAME_CONSTRAINTS.pattern}"
          title="${USERNAME_CONSTRAINTS.patternTitle}"
          autocomplete="off"
          autocapitalize="off"
          spellcheck=""
          required
        />
        <button>Create Account</button>
        <${RegStatus}/>
      </fieldset>
    </form>
  `;
}

function RegStatus() {
  const elements = [];
  if (regInProgress.value) {
    elements.push(html`<span class="spinner small"></span>`);
  }
  if (regStatus.value === REG_STATUS.Success) {
    elements.push(html`<span class="success-msg">Redirecting...</span>`);
  } else if (regErrorMsg.value) {
    elements.push(html`<span class="error-msg">${regErrorMsg}</span>`);
  }
  return elements;
}

async function submitReg(event) {
  event.preventDefault();
  regStatus.value = REG_STATUS.Pending;
  abortController = new AbortController();
  regUsername.value = event.target.username.value;
  try {
    const pubKeyOptions = await getPubKeyOptions();
    if (!pubKeyOptions) return;
    const credential = await getPubKeyCredential(pubKeyOptions);
    verifyRegResponse(credential);
  } catch (error) {
    console.log(error);
    setRegStatusFromError(error);
  }
}

async function getPubKeyOptions() {
  const resp = await fetch("/webauthn/pubkey-options", {
    method: "post",
    body: JSON.stringify({ username: regUsername.value }),
    signal: abortController.signal,
  });
  if (!resp.ok) {
    const statusText = await resp.text();
    if (!statusText) throw new Error();
    regStatus.value = statusText;
  } else {
    return resp.json();
  }
}

function convertPubKeyOptions(pubKeyOptions) {
  const result = { ...pubKeyOptions };
  result.user.id = new TextEncoder().encode(pubKeyOptions.user.id);
  result.challenge = base64UrlToBytes(pubKeyOptions.challenge);
  return result;
}

function getPubKeyCredential(pubKeyOptions) {
  return navigator.credentials.create({
    publicKey: convertPubKeyOptions(pubKeyOptions),
    signal: abortController.signal,
  });
}

function convertPubKeyCredential(credential) {
  return {
    type: credential.type,
    attestationObject: bufferToBase64(credential.response.attestationObject),
    clientDataJson: bufferToBase64(credential.response.clientDataJSON),
  };
}

async function verifyRegResponse(credential) {
  const resp = await fetch("/webauthn/verify-reg-response", {
    method: "post",
    body: JSON.stringify(convertPubKeyCredential(credential)),
    signal: abortController.signal,
  });
  regStatus.value = resp.ok ? REG_STATUS.Success : REG_STATUS.GeneralError;
}

function setRegStatusFromError(error) {
  regStatus.value = REG_STATUS_BY_ERROR[error.name] || REG_STATUS.GeneralError;
}

function base64UrlToBytes(base64Url) {
  const base64 = base64Url.replaceAll("-", "+").replaceAll("_", "/");
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

function bufferToBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}
