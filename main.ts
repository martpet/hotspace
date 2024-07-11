import App from "./lib/app.ts";
import htmlTemplate from "./helpers/html_template.ts";
import home from "./routes/home.ts";
import foobar from "./routes/foobar.ts";
import userspace from "./routes/userspace.ts";
import staticHandler from "./routes/_static.ts";
import error404 from "./routes/_404.ts";
import error500 from "./routes/_500.ts";

const HOSTNAME = "(localhost|hotspace.lol)";

const app = new App({
  htmlTemplate,
  errorHandler: error500,
  patternInputHostname: HOSTNAME,
});

app.addRoute("/static/*", staticHandler);
app.addRoute("/", home);
app.addRoute({ hostname: `:username.${HOSTNAME}`, pathname: "/" }, userspace);
app.addRoute("/foobar", foobar);
app.addRoute("*", error404);

app.listen();
