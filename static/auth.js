import { html } from "/static/preact.js";

export function RegForm(props) {
  const consts = JSON.parse(props.consts);
  const constraints = consts.USERNAME_CONSTRAINTS;

  return html`
    <form class="reg-form" onSubmit=${submitForm}>
      <label for="username">Username:</label>
      <input
        id="username"
        type="text"
        minlength="${constraints.MIN_LENGTH}"
        maxlength="${constraints.MAX_LENGTH}"
        pattern="${constraints.PATTERN}"
        title="${constraints.PATTERN_TITLE}"
        autocomplete="off"
        autocapitalize="off"
        spellcheck=""
        required
      />
      <button>Create Account</button>
    </form>
  `;
}

async function submitForm(event) {
  event.preventDefault();
  const username = event.target.username.value;
  await getPubKeyOptions(username);
}

async function getPubKeyOptions(username) {
  const resp = await fetch("/webauthn/pubkey-options", {
    method: "post",
    body: JSON.stringify({ username }),
  });
  const data = await resp.json();
  console.log(data);
}
