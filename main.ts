import Server from "$server";
import logout from "./handlers/auth/logout.ts";
import webauthnPubkeyOptions from "./handlers/auth/pubkey_options.ts";
import webauthnVerifyReg from "./handlers/auth/verify_reg.ts";
import devHome from "./handlers/dev/home.tsx";
import resetDb from "./handlers/dev/reset-db.ts";
import notFound404 from "./handlers/error/_404.tsx";
import errorHandler from "./handlers/error/_500.tsx";
import home from "./handlers/home.tsx";
import staticFiles from "./handlers/static-files.ts";
import userHome from "./handlers/userspace/home.tsx";
import { logger } from "./middleware/logger.ts";
import { session } from "./middleware/session.ts";
import { ROOT_DOMAIN_URLPATTERN as DOMAIN } from "./utils/consts.ts";

const app = new Server({
  errorHandler,
  rootDomainURLPattern: DOMAIN,
});

app.addMiddleware(logger);
app.addMiddleware(session);

app.addRoute("/", home);
app.addRoute("/static/*", staticFiles);
app.addRoute({ hostname: `:username.${DOMAIN}`, pathname: "/" }, userHome);
app.addRoute("/logout", logout);
app.addRoute("/webauthn/pubkey-options", webauthnPubkeyOptions);
app.addRoute("/webauthn/verify-reg", webauthnVerifyReg);
app.addRoute("/dev", devHome);
app.addRoute("/dev/reset-db", resetDb);
app.addRoute({ hostname: "*", pathname: "*" }, notFound404);

app.serve();
