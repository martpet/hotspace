import Server from "$server";
import error404 from "./handlers/error/_404.ts";
import error500 from "./handlers/error/_500.ts";
import home from "./handlers/home.ts";
import staticFiles from "./handlers/static-files.ts";
import userHome from "./handlers/user-home.ts";
import webauthnPubkeyOptions from "./handlers/webauthn/pubkey_options.ts";
import webauthnVerifyReg from "./handlers/webauthn/verify_reg_response.ts";
import { logger } from "./middleware/logger.ts";

const HOSTNAME = "(hotspace.lol|localhost)"; // todo: add *.deno.dev

const app = new Server({
  errorHandler: error500,
  urlPatternHostname: HOSTNAME,
});

app.addMiddleware(logger);

app.addRoute("/", home);
app.addRoute("/static/*", staticFiles);
app.addRoute({ hostname: `:username.${HOSTNAME}`, pathname: "/" }, userHome);
app.addRoute("/webauthn/pubkey-options", webauthnPubkeyOptions);
app.addRoute("/webauthn/verify-reg-response", webauthnVerifyReg);
app.addRoute("*", error404);

app.serve();
