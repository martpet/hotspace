let html;

if (typeof document !== "undefined") {
  html = (await import("/static/preact.js")).html;
}

export const CONSTRAINTS = {
  MIN_LENGTH: 4,
  MAX_LENGTH: 30,
  PATTERN: "^[a-z0-9._-]+$",
  PATTERN_TITLE: "Small letters, numbers, dots, hyphens, and underscores",
};

export function RegForm(props) {
  return html`
    <form class="reg-form" onSubmit=${submitForm}>
      <label for="username">Username:</label>
      <input
        id="username"
        type="text"
        minlength="${CONSTRAINTS.MIN_LENGTH}"
        maxlength="${CONSTRAINTS.MAX_LENGTH}"
        pattern="${CONSTRAINTS.PATTERN}"
        title="${CONSTRAINTS.PATTERN_TITLE}"
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
