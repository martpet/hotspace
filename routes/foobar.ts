export default function foobar() {
  return `
    <title>Dev Test</title>
    <script type="module" src="/static/widget.js"></script>

    <h1>Foo bar</h1>
    <div id="widget"></div>

    <script>document.querySelector('h1').innerHTML += "🌎";</script>
    <script src="/static/something.js"></script>
  `;
}
