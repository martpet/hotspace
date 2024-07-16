export default function registration() {
  return `
    <noscript>Registration works only with JavaScript enabled!</noscript>

    <div id="reg-root"></div>

    <script type="module">
      import { Registration } from "/static/webauthn.js";
      import { html, render } from "/static/preact.js";
      const rootElement = document.querySelector("#reg-root");
      ${"render(html`<${Registration} />`, rootElement);"}
    </script>
  `;
}
