export function registration() {
  return `
    <noscript>Registration requires JavaScript!</noscript>
    <div id="reg-root"></div>
    <script type="module">
      import { initReg } from "/static/webauthn.js";
      initReg('reg-root');
    </script>
  `;
}
