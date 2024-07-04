import App from "./lib/app.ts";

import spacepage from "./routes/space.ts";
import homepage from "./routes/home.ts";
import foobar from "./routes/foobar.ts";

const DOMAINS = "(localhost|hotspace.lol)";

const app = new App();

app.addRoute({ pathname: "/", hostname: `:username.${DOMAINS}` }, spacepage);

app.addRoute("/", homepage);

app.addRoute("/foobar", foobar);

app.listen();
