import { decodeBase64Url, encodeBase64, GENERAL_ERR_MSG } from "$main";

// =====================
// WebAuthn Reg flow
// =====================

const form = document.getElementById("reg-form");
const button = form.querySelector("button");
const usernameField = document.getElementById("username");
const isNewAccount = !!usernameField;

const generalRegFlowErrorMsg = isNewAccount
  ? "Registration was not completed"
  : "A passkey was not added";

function setInProgress(inProgrss) {
  if (usernameField) usernameField.disabled = inProgrss;
  button.disabled = inProgrss;
  button.classList.toggle("spinner", inProgrss);
}

function setError(msg) {
  if (msg) {
    setInProgress(false);
    form.insertAdjacentHTML(
      "afterend",
      `<p role="alert" class="error">${msg}</p>`
    );
  } else {
    form.querySelector("p.error")?.remove();
  }
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
      setError("You already have a passkey on this device");
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
