import {
  REG_TIMEOUT,
  RegStatus,
  USERNAME_CONSTRAINTS,
} from "../utils/webauthn.ts";

const regConsts = {
  REG_TIMEOUT,
  RegStatus,
  USERNAME_CONSTRAINTS,
};

export default function regForm() {
  return `
    <div id="reg"></div>
 
    <noscript>
      Registration requires JavaScript!
    </noscript>

    <script type="module">
      import { html, render } from "/static/preact.js";
      import { RegForm } from "/static/auth.js";
      const rootEl = document.getElementById("reg");
      const consts = '${JSON.stringify(regConsts)}';
      ${"render(html`<${RegForm} consts=${consts} />`, rootEl);"}
    </script>
  `;
}
