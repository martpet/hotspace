let render, html, signal, computed, useComputed;

if (typeof document !== "undefined") {
  const preact = await import("./preact.js");
  ({ render, html, signal, computed, useComputed } = preact);
}

export const REG_TIMEOUT = 1000 * 60;

export const REG_STATUS = {
  Idle: "IDLE",
  Pending: "PENDING",
  Success: "SUCCESS",
  UsernameTaken: "USERNAME_TAKEN",
  WebAuthnUnsupported: "WEBAUTHN_UNSUPPORTED",
  Aborted: "ABORTED",
  AuthenticatorError: "AUTHENTICATOR_ERROR",
  GeneralError: "GENERAL_ERROR",
};

const REG_ERROR_MSG = {
  [REG_STATUS.UsernameTaken]: "Username is already registered.",
  [REG_STATUS.WebAuthnUnsupported]: "Your browser doesn't support Passkeys.",
  [REG_STATUS.Aborted]: "Registration was canceled.",
  [REG_STATUS.AuthenticatorError]: "Registration was not completed.",
  [REG_STATUS.GeneralError]: "Something went wrong!",
};

export const USERNAME = {
  minLength: 4,
  maxLength: 30,
  pattern: "^[a-z0-9._-]+$",
  patternTitle: "Small letters, numbers, dots, hyphens, and underscores",
};

const defaultRegStatus = typeof PublicKeyCredential === "undefined"
  ? REG_STATUS.WebAuthnUnsupported
  : REG_STATUS.Idle;

let regStatus, regErrorMsg, abortController;

export async function initReg(rootId) {
  regStatus = signal(defaultRegStatus);
  regErrorMsg = computed(computeRegErrorMsg);
  const rootEl = document.getElementById(rootId);
  render(html`<${RegForm} />`, rootEl);
}

function computeFormDisabled() {
  return regStatus.value === REG_STATUS.Pending;
}

function computeRegErrorMsg() {
  return REG_ERROR_MSG[regStatus.value];
}

function RegForm() {
  const isDisabled = useComputed(computeFormDisabled);

  return html`
    <form class="reg-form" onSubmit=${submitReg}>
      <fieldset disabled=${isDisabled}>
        <label for="username">Username:</label>
        <input
          id="username"
          type="text"
          minlength="${USERNAME.minLength}"
          maxlength="${USERNAME.maxLength}"
          pattern="${USERNAME.pattern}"
          title="${USERNAME.patternTitle}"
          autocomplete="off"
          autocapitalize="off"
          spellcheck=""
          required
        />
        <button>Create Account</button>
        <${Spinner}/>
      </fieldset>
    </form>
    <${RegError}/>
  `;
}

function Spinner() {
  if (regStatus.value === REG_STATUS.Pending) {
    return html`<span class="spinner small"></span>`;
  }
}

function RegError() {
  if (regErrorMsg.value) {
    return html`<p class="error-msg">${regErrorMsg}</p>`;
  }
}

async function submitReg(event) {
  event.preventDefault();
  regStatus.value = REG_STATUS.Pending;
  abortController = new AbortController();
  const username = event.target.username.value;
  try {
    const pubKeyOptionsJson = await getPubKeyOptions(username);
    if (!pubKeyOptionsJson) return;
    await getPubKeyCredentials(pubKeyOptionsJson);
  } catch (error) {
    setRegStatusFromError(error);
  }
}

async function getPubKeyOptions(username) {
  const resp = await fetch("/webauthn/pubkey-options", {
    method: "post",
    body: JSON.stringify({ username }),
    signal: abortController.signal,
  });
  if (!resp.ok) {
    const status = await resp.text();
    if (!status) throw new Error();
    regStatus.value = status;
  } else {
    return resp.json();
  }
}

async function getPubKeyCredentials(pubKeyOptionsJson) {
  const pubKeyOptions = decodePubKeyOptions(pubKeyOptionsJson);
  return navigator.credentials.create({
    publicKey: pubKeyOptions,
    signal: abortController.signal,
  });
}

function decodePubKeyOptions(pubKeyOptionsJson) {
  const decoded = { ...pubKeyOptionsJson };
  decoded.challenge = base64ToBytes(pubKeyOptionsJson.challenge);
  decoded.user.id = base64ToBytes(pubKeyOptionsJson.user.id);
  return decoded;
}

function base64ToBytes(base64) {
  const binString = atob(base64);
  return Uint8Array.from(binString, (m) => m.codePointAt(0));
}

function setRegStatusFromError(error) {
  const statusPerError = {
    AbortError: REG_STATUS.Aborted,
    NotAllowedError: REG_STATUS.AuthenticatorError,
  };
  const status = statusPerError[error.name];
  regStatus.value = status || REG_STATUS.GeneralError;
}
