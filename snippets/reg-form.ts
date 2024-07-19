export default function regForm() {
  return `
    <div id="reg"></div>
 
    <noscript>
      Registration requires JavaScript!
    </noscript>

    <script type="module">
      import { RegForm } from "/static/auth.js";
      import { html, render } from "/static/preact.js";
      ${'render(html`<${RegForm} />`, document.getElementById("reg"));'}
    </script>
  `;
}
