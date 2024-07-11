export default function foobar() {
  return `
    <title>Foobar Page</title>
    <script type="module" src="/static/widget.js"></script>
    <h1>Foo bar</h1>
    <div id="widget"></div>
    <script src="/static/foobar.js"></script>
    <script>document.querySelector('h1').innerHTML += "🌎";</script>
  `;
}
