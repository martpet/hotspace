import App from "./lib/app/mod.ts";
import htmlTemplateBuilder from "./utils/html_template.ts";
import { exampleMiddleware } from "./middleware/example_middleware.ts";
import staticFilesHandler from "./routes/static.ts";
import error404 from "./routes/errors/error404.ts";
import serverErrorHandler from "./routes/errors/error500.ts";
import home from "./routes/home.ts";
import space from "./routes/space.ts";
import pubkeyOptions from "./routes/webauthn/pubkey-options.ts";

const HOSTNAME = "(hotspace.lol|localhost)";

const app = new App({
  htmlTemplateBuilder,
  serverErrorHandler,
  hostnamePattern: HOSTNAME,
});

app.addMiddleware(exampleMiddleware);

app.addRoute("/static/*", staticFilesHandler);
app.addRoute("/", home);
app.addRoute("/webauthn/pubkey-options", pubkeyOptions);
app.addRoute({ pathname: "/", hostname: `:username.${HOSTNAME}` }, space);
app.addRoute({ pathname: "*", hostname: "*" }, error404);
app.listen();
