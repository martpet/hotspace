import App from "./lib/app.ts";
import htmlTemplateBuilder from "./helpers/html_template.ts";
import home from "./routes/home.ts";
import foobar from "./routes/foobar.ts";
import userspace from "./routes/userspace.ts";
import staticHandler from "./routes/_static.ts";
import error404 from "./routes/_404.ts";
import errorHandler from "./routes/_500.ts";
import { exampleMiddleware } from "./middleware/example.ts";

const HOSTNAME = "(localhost|hotspace.lol)";

const app = new App({
  htmlTemplateBuilder,
  errorHandler,
  urlPatternHostname: HOSTNAME,
});

app.addMiddleware(exampleMiddleware);
app.addRoute("/static/*", staticHandler);
app.addRoute("/", home);
app.addRoute({ hostname: `:username.${HOSTNAME}`, pathname: "/" }, userspace);
app.addRoute("/foobar", foobar);
app.addRoute("*", error404);
app.listen();
