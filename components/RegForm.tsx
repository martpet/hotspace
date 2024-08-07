const scriptContent = `
  import { RegForm } from "/static/webauthn.js";
  import { render, html } from "/static/preact.js";
  const rootEl = document.getElementById("reg-form-root");
  ${"render(html`<${RegForm} />`, rootEl)"}
`;

export default function RegForm() {
  return (
    <>
      <div id="reg-form-root" />
      <noscript>Registration requires JavaScript!</noscript>
      <script
        type="module"
        dangerouslySetInnerHTML={{ __html: scriptContent }}
      />
    </>
  );
}
