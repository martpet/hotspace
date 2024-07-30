let render, html, signal, computed, useComputed;

if (typeof document !== "undefined") {
  const preact = await import("/static/preact.js");
  ({ render, html, signal, computed, useComputed } = preact);
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

const REG_STATUS_BY_ERROR_NAME = {
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

let regStatus, regErrMsg, abortController;

export async function initRegForm(rootId) {
  regStatus = signal(DEFAULT_REG_STATUS);
  regErrMsg = computed(() => REG_ERROR_MSG[regStatus.value]);
  const rootEl = document.getElementById(rootId);
  render(html`<${RegForm} />`, rootEl);
}

async function submitReg(event) {
  event.preventDefault();
  regStatus.value = REG_STATUS.Pending;
  abortController = new AbortController();
  const username = event.target.username.value;
  try {
    const pubKeyOptions = await getPubKeyOptions(username);
    if (!pubKeyOptions) return;
    const credential = await getPubKeyCredential(pubKeyOptions);
    verifyPubKeyCredential(credential);
  } catch (error) {
    console.log(error);
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

async function verifyPubKeyCredential(credential) {
  const resp = await fetch("/webauthn/verify-pubkey-credential", {
    method: "post",
    body: JSON.stringify(convertPubKeyCredential(credential)),
  });
  regStatus.value = resp.ok ? REG_STATUS.Success : REG_STATUS.GeneralError;
}

function setRegStatusFromError(error) {
  regStatus.value = REG_STATUS_BY_ERROR_NAME[error.name] ||
    REG_STATUS.GeneralError;
}

function RegForm() {
  const disabled = useComputed(() => regStatus.value === REG_STATUS.Pending);
  const loading = useComputed(() => regStatus.value === REG_STATUS.Pending);

  return html`
    <form class="reg-form" onSubmit=${submitReg}>
      <fieldset disabled=${disabled}>
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
        <${Spinner} visible=${loading.value} />
      </fieldset>
    </form>
    <${ErrorMsg} msg=${regErrMsg.value}/>
  `;
}

function Spinner({ visible }) {
  return visible && html`<span class="spinner small"></span>`;
}

function ErrorMsg({ msg }) {
  return msg && html`<p class="error-msg">${msg}</p>`;
}

function base64UrlToBytes(base64Url) {
  const base64 = base64Url.replaceAll("-", "+").replaceAll("_", "/");
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

function bufferToBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}
