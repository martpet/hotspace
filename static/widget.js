import { html, render } from "/static/preact.js";

function Widget(props) {
  return html`My name is ${props.name}.`;
}

const rootEl = document.getElementById("widget");
render(html`<${Widget} name="John" />`, rootEl);
