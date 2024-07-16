import App from "./lib/app.ts";
import htmlDocBuilder from "./utils/html_doc.ts";
import staticFilesHandler from "./routes/static.ts";
import error404 from "./routes/error404.ts";
import serverErrorHandler from "./routes/error500.ts";
import home from "./routes/home.ts";
import userspace from "./routes/userspace.ts";
import { exampleMiddleware } from "./middleware/example.ts";

const HOSTNAME = "(localhost|hotspace.lol)";

const app = new App({
  htmlDocBuilder,
  serverErrorHandler,
  hostnamePattern: HOSTNAME,
});

app.addRoute("/static/*", staticFilesHandler);
app.addRoute("/", home);
app.addRoute({ pathname: "/", hostname: `:username.${HOSTNAME}` }, userspace);
app.addRoute({ pathname: "*", hostname: "*" }, error404);
app.addMiddleware(exampleMiddleware);
app.listen();
