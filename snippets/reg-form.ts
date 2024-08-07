export const regForm = `
  <div id="reg-form-root"></div>
  <noscript>Registration requires JavaScript!</noscript>
  <script type="module">
    import { RegForm } from "/static/webauthn.js";
    import { render, html } from "/static/preact.js";
    const root = document.getElementById("reg-form-root");
    ${"render(html`<${RegForm} />`, root)"}
  </script>
`;
