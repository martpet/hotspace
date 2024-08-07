import Server from "$server";
import error404 from "./handlers/error/_404.ts";
import error500 from "./handlers/error/_500.ts";
import home from "./handlers/home.ts";
import logout from "./handlers/logout.ts";
import staticFiles from "./handlers/static-files.ts";
import userHome from "./handlers/user/home.ts";
import webauthnPubkeyOptions from "./handlers/webauthn/pubkey_options.ts";
import webauthnVerifyReg from "./handlers/webauthn/verify_reg.ts";
import { logger } from "./middleware/logger.ts";
import { session } from "./middleware/session.ts";
import { BASE_HOSTNAME_URLPATTERN as HOSTNAME } from "./utils/consts.ts";

const app = new Server({
  errorHandler: error500,
  baseHostnameUrlPattern: HOSTNAME,
});

app.addMiddleware(logger);
app.addMiddleware(session);

app.addRoute("/", home);
app.addRoute("/static/*", staticFiles);
app.addRoute({ hostname: `:username.${HOSTNAME}`, pathname: "/" }, userHome);
app.addRoute("/logout", logout);
app.addRoute("/webauthn/pubkey-options", webauthnPubkeyOptions);
app.addRoute("/webauthn/verify-reg", webauthnVerifyReg);
app.addRoute({ hostname: "*", pathname: "*" }, error404);

app.serve();
