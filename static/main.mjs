const FETCH_INTERCEPTORS = [];

window.APP = {
  isMobile: /Mobi|Android/i.test(navigator.userAgent),
  GENERAL_ERROR_MSG: "Oops, something went wrong, try again!",
  SESSION_EXPIRED_ERROR_MSG: "Your session has expired! Sign in to continue.",
  collapseLineBreaks,
};

// =====================
// Utilities
// =====================

function base64UrlToBytes(base64Url) {
  const base64 = base64Url.replaceAll("-", "+").replaceAll("_", "/");
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

function bufferToBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function collapseLineBreaks(text, maxBreaks) {
  const regex = new RegExp(`(\\n{${maxBreaks},})`, "g");
  const replacement = "\n".repeat(maxBreaks);
  return text.replace(regex, replacement).trim();
}

// =====================
// Fetch With Intercept
// =====================

const _fetch = window.fetch;
window.fetch = async function (url, config) {
  const resp = await _fetch(url, config);
  FETCH_INTERCEPTORS.forEach((fn) => fn(resp));
  return resp;
};

// =====================
// Handle Fetch Resp 401
// =====================

FETCH_INTERCEPTORS.push((resp) => {
  if (resp.status === 401 && new URL(resp.url).host === location.host) {
    alert(APP.SESSION_EXPIRED_ERROR_MSG);
    location.reload();
  }
});

// =====================
// WebAuthn Auth Flow
// =====================
{
  const button = document.querySelector(".request-credential");

  function setInProgress(inProgrss) {
    button.disabled = inProgrss;
    button.classList.toggle("spin", inProgrss);
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
      showError(APP.GENERAL_ERROR_MSG);
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
        err.name === "NotAllowedError" // Other browsers
      ) {
        setInProgress(false);
      } else {
        showError(APP.GENERAL_ERROR_MSG);
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
      showError(APP.GENERAL_ERROR_MSG);
      console.error(err);
    }
  });

  async function createPubkeyOptions() {
    const resp = await fetch("/auth/cred-request-options", { method: "post" });
    if (!resp.ok) {
      throw new Error("Pubkey request options creation error");
    }
    const data = await resp.json();
    data.challenge = base64UrlToBytes(data.challenge);
    return data;
  }

  async function verify(credential) {
    const assertion = {
      credId: credential.id,
      type: credential.type,
      signature: bufferToBase64(credential.response.signature),
      authData: bufferToBase64(credential.response.authenticatorData),
      clientDataJson: bufferToBase64(credential.response.clientDataJSON),
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
// WebAuthn Reg Flow
// =====================
{
  const form = document.getElementById("create-credential");
  const button = form?.querySelector("button");
  const errorEl = form?.querySelector(".alert.error");
  const usernameField = document.getElementById("username");
  const isNewAccount = !!usernameField;

  const generalRegFlowErrorMsg = isNewAccount
    ? "Registration was not completed!"
    : "Passkey was not created!";

  function setInProgress(inProgrss) {
    if (usernameField) usernameField.disabled = inProgrss;
    button.disabled = inProgrss;
    button.classList.toggle("spin", inProgrss);
  }

  function setError(msg) {
    if (msg) {
      errorEl.textContent = msg;
      errorEl.hidden = false;
      setInProgress(false);
    } else {
      errorEl.hidden = true;
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
      setError(APP.GENERAL_ERROR_MSG);
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
        setError(APP.GENERAL_ERROR_MSG);
      }
    } catch (err) {
      setError(APP.GENERAL_ERROR_MSG);
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
    data.challenge = base64UrlToBytes(data.challenge);
    data.user.id = new TextEncoder().encode(data.user.id);
    data.excludeCredentials = data.excludeCredentials.map((item) => ({
      ...item,
      id: base64UrlToBytes(item.id),
    }));
    return data;
  }

  async function verify(credential) {
    const attestation = {
      type: credential.type,
      pubKey: bufferToBase64(credential.response.getPublicKey()),
      authData: bufferToBase64(credential.response.getAuthenticatorData()),
      clientDataJson: bufferToBase64(credential.response.clientDataJSON),
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
