import App from "./lib/app.ts";

const app = new App();

app.addRoute("/static/*", "static");
app.addRoute({ pathname: "/", hostname: ":spacename.*" }, "space");
app.addRoute("/", "home");

app.listen();
