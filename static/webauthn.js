let html, useSignal, useComputed, useSignalEffect;

if (typeof document !== "undefined") {
  const preact = await import("/static/preact.js");
  ({ html, useSignal, useComputed, useSignalEffect } = preact);
}

export const USERNAME_CONSTRAINTS = {
  minLength: 3,
  maxLength: 30,
  pattern: "^[a-z0-9_\\-]+$",
  patternTitle: "Lower case letters, numbers, underscores, and hyphens.",
};

export const REG_STATUS = {
  Idle: "IDLE",
  Pending: "PENDING",
  Success: "SUCCESS",
  UsernameTaken: "USERNAME_TAKEN",
  WebAuthnUnsupported: "WEBAUTHN_UNSUPPORTED",
  AuthenticatorError: "AUTHENTICATOR_ERROR",
  GeneralError: "GENERAL_ERROR",
};

const REG_STATUS_BY_RUNTIME_ERROR = {
  NotAllowedError: REG_STATUS.AuthenticatorError,
};

const INITIAL_REG_STATUS = typeof PublicKeyCredential === "undefined"
  ? REG_STATUS.WebAuthnUnsupported
  : REG_STATUS.Idle;

const REG_STATUS_ERROR_MSG = {
  [REG_STATUS.UsernameTaken]: "Sorry, this username is taken.",
  [REG_STATUS.AuthenticatorError]: "Registration was not completed.",
  [REG_STATUS.WebAuthnUnsupported]: "Your browser doesn't support Passkeys.",
  [REG_STATUS.GeneralError]: "Something went wrong, try again!",
};

export function RegForm() {
  const username = useSignal("");
  const status = useSignal(INITIAL_REG_STATUS);
  const inProgress = useComputed(() => status.value === REG_STATUS.Pending);
  const errorMsg = useComputed(() => REG_STATUS_ERROR_MSG[status.value]);

  useSignalEffect(() => {
    if (status.value === REG_STATUS.Success) {
      location.reload();
    }
  });

  async function onSubmit(e) {
    e.preventDefault();
    status.value = REG_STATUS.Pending;
    status.value = await register(username.value);
  }

  return html`
    <form class="reg-form" onSubmit=${onSubmit}>
      <fieldset disabled=${inProgress}>
        <label for="username">Username:</label>
        <input
          id="username"
          type="text"
          value="${username}"
          onChange=${(e) => username.value = e.currentTarget.value}
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
        ${inProgress.value && html`<span class="spinner small"></span>`}
      </fieldset>
      ${errorMsg.value && html`<p class="error-msg">${errorMsg}</p>`}
    </form>
  `;
}

async function register(username) {
  try {
    const pubkeyOpt = await createPubKeyOptions(username);
    if (pubkeyOpt.error) return pubkeyOpt.error;
    const cred = await navigator.credentials.create({ publicKey: pubkeyOpt });
    return verifyReg(cred);
  } catch (err) {
    console.error(err);
    return REG_STATUS_BY_RUNTIME_ERROR[err.name] || REG_STATUS.GeneralError;
  }
}

async function createPubKeyOptions(username) {
  const resp = await fetch("/webauthn/pubkey-options", {
    body: JSON.stringify({ username }),
    method: "post",
  });
  if (resp.ok) {
    const data = await resp.json();
    data.challenge = base64UrlToBytes(data.challenge);
    data.user.id = new TextEncoder().encode(data.user.id);
    return data;
  } else {
    return { error: await resp.text() };
  }
}

async function verifyReg(credential) {
  const postData = {
    type: credential.type,
    attestationObject: bufferToBase64(credential.response.attestationObject),
    clientDataJson: bufferToBase64(credential.response.clientDataJSON),
  };
  const resp = await fetch("/webauthn/verify-reg", {
    body: JSON.stringify(postData),
    method: "post",
  });
  return resp.ok ? REG_STATUS.Success : REG_STATUS.GeneralError;
}

function base64UrlToBytes(base64Url) {
  const base64 = base64Url.replaceAll("-", "+").replaceAll("_", "/");
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

function bufferToBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}
