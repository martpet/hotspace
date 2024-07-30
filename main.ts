import App from "./lib/app/mod.ts";
import htmlTemplateBuilder from "./utils/html_template.ts";
import { requestLogger } from "./middleware/request-logger.ts";
import staticFilesHandler from "./routes/static.ts";
import error404 from "./routes/errors/error404.ts";
import serverErrorHandler from "./routes/errors/error500.ts";
import home from "./routes/home.ts";
import userSpace from "./routes/user-space.ts";
import pubKeyOptions from "./routes/webauthn/pubkey-options.ts";
import verifyRegResponse from "./routes/webauthn/verify-reg-response.ts";

const HOSTNAME = "(hotspace.lol|localhost)";

const app = new App({
  htmlTemplateBuilder,
  serverErrorHandler,
  hostnamePattern: HOSTNAME,
});

app.addMiddleware(requestLogger);

app.addRoute("/static/*", staticFilesHandler);
app.addRoute("/", home);
app.addRoute({ pathname: "/", hostname: `:username.${HOSTNAME}` }, userSpace);
app.addRoute("/webauthn/pubkey-options", pubKeyOptions);
app.addRoute("/webauthn/verify-reg-response", verifyRegResponse);
app.addRoute({ pathname: "*", hostname: "*" }, error404);

app.listen();
