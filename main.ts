import App from "./lib/app.ts";

import home from "./routes/home.ts";
import foobar from "./routes/foobar.ts";
import userspace from "./routes/userspace.ts";

const HOSTNAME = "(localhost|hotspace.lol)";

const app = new App({
  urlPatternHostname: HOSTNAME,
});

app.addRoute("/", home);
app.addRoute("/foobar", foobar);
app.addRoute({ hostname: `:username.${HOSTNAME}`, pathname: "/" }, userspace);

app.listen();
