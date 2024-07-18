import { REG_TIMEOUT, USERNAME_CONSTRAINTS } from "../utils/webauthn.ts";

const regFormConsts = {
  ...USERNAME_CONSTRAINTS,
  REG_TIMEOUT,
};

export default function regForm() {
  return `
    <div id="reg"></div>
    
    <noscript>Registration requires JavaScript!</noscript>

    <script type="module">
      import { html, render } from "/static/preact.js";
      import { RegForm } from "/static/auth.js";
      const consts = '${JSON.stringify(regFormConsts)}';
      const root = document.getElementById("reg");
      ${"render(html`<${RegForm} consts=${consts} />`, root);"}
    </script>
  `;
}
