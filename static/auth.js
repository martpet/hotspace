import { html } from "/static/preact.js";

export function RegForm(props) {
  const consts = JSON.parse(props.consts);

  return html`
    <form class="reg-form" onSubmit=${submitForm}>
      <label for="username">Username:</label>
      <input
        id="username"
        type="text"
        minlength="${consts.MIN_LENGTH}"
        maxlength="${consts.MAX_LENGTH}"
        pattern="${consts.PATTERN}"
        title="${consts.PATTERN_TITLE}"
        autocomplete="off"
        autocapitalize="off"
        spellcheck=""
        required
      />
      <button>Create Account</button>
    </form>
  `;
}

function submitForm(event) {
  event.preventDefault();
  const username = event.target.username.value;
  getPubKeyOptions(username);
}

function getPubKeyOptions(username) {
  abortController.value = new AbortController();
  fetch("/webauthn/pubkey-options", {
    method: "post",
    body: JSON.stringify({ username }),
  });
}
