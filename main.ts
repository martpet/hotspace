import Server from "$server";
import error404 from "./handlers/error/_404.ts";
import error500 from "./handlers/error/_500.ts";
import home from "./handlers/home.ts";
import staticFiles from "./handlers/static-files.ts";
import userHome from "./handlers/user-home.ts";
import webauthnPubkeyOptions from "./handlers/webauthn/pubkey_options.ts";
import webauthnVerifyReg from "./handlers/webauthn/verify_reg.ts";
import { logger } from "./middleware/logger.ts";
import { sessions } from "./middleware/sessions.ts";
import { STATIC_FILES_URL_PATTERN } from "./utils/consts.ts";

const HOSTNAMES = "(hotspace.lol|localhost)"; // todo: add *.deno.dev

const app = new Server({
  errorHandler: error500,
  urlPatternHostname: HOSTNAMES,
});

app.addMiddleware(logger);
app.addMiddleware(sessions);

app.addRoute("/", home);
app.addRoute(STATIC_FILES_URL_PATTERN, staticFiles);
app.addRoute({ hostname: `:username.${HOSTNAMES}`, pathname: "/" }, userHome);
app.addRoute("/webauthn/pubkey-options", webauthnPubkeyOptions);
app.addRoute("/webauthn/verify-reg", webauthnVerifyReg);
app.addRoute("*", error404);

app.serve();
