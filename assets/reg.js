// =====================
// WebAuthn Reg flow
// =====================

import { decodeBase64Url, encodeBase64, GENERAL_ERR_MSG } from "$main";

const regForm = document.getElementById("reg-form");
const submitBtn = document.getElementById("reg-form-submit");
const errorEl = document.getElementById("reg-form-error");
const usernameField = document.getElementById("reg-form-username");
const isNewAccount = !!usernameField;

const generalRegFlowErrorMsg = isNewAccount
  ? "Registration was not completed"
  : "A passkey was not added";

submitBtn.disabled = false;

function renderProgress(flag) {
  if (flag) renderError(null);
  submitBtn.disabled = flag;
  submitBtn.classList.toggle("spinner", flag);
  if (usernameField) usernameField.disabled = flag;
}

function renderError(msg) {
  if (msg) renderProgress(false);
  errorEl.hidden = !msg;
  errorEl.textContent = msg;
}

regForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  renderProgress(true);
  try {
    await register();
    location.reload();
  } catch (err) {
    renderError(err.message);
  }
});

async function register() {
  const publicKey = await createPubKeyOptions(usernameField?.value);
  const credential = await getCredential(publicKey);
  return verifyCredential(credential);
}

async function createPubKeyOptions(username) {
  const resp = await fetch("/auth/credential-creation-options", {
    method: "post",
    body: username,
  });
  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(data?.error || GENERAL_ERR_MSG);
  }
  data.challenge = decodeBase64Url(data.challenge);
  data.user.id = new TextEncoder().encode(data.user.id);
  data.excludeCredentials = data.excludeCredentials.map((item) => ({
    ...item,
    id: decodeBase64Url(item.id),
  }));
  return data;
}

async function getCredential(publicKey) {
  try {
    return await navigator.credentials.create({ publicKey });
  } catch (err) {
    console.error(err);
    if (err.name === "InvalidStateError") {
      throw new Error("You already have a passkey on this device");
    } else {
      throw new Error(generalRegFlowErrorMsg);
    }
  }
}

async function verifyCredential(credential) {
  const attestation = {
    type: credential.type,
    pubKey: encodeBase64(credential.response.getPublicKey()),
    authData: encodeBase64(credential.response.getAuthenticatorData()),
    clientDataJson: encodeBase64(credential.response.clientDataJSON),
  };
  const resp = await fetch("/auth/credential-creation-verify", {
    method: "post",
    body: JSON.stringify(attestation),
  });
  if (!resp.ok) {
    throw new Error("Credential attestation verification error");
  }
}
