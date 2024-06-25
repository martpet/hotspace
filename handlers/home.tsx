export function home() {
  return `
    <title>Hello World!</title>
    <script type="module" src="/static/widget.js"></script>

    <h1>Hello</h1>
    <div id="widget"></div>

    <script>document.querySelector('h1').innerHTML += "🌎";</script>
    <script src="/static/something.js"></script>
  `;
}
