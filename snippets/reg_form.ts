export const regForm = `
  <noscript>Registration requires JavaScript!</noscript>
  <div id="reg-form-root"></div>
  <script type="module">
    import { initRegForm } from "/static/webauthn.js";
    initRegForm('reg-form-root');
  </script>
`;
