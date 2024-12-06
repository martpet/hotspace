import { flashMiddleware, IS_LOCAL_DEV, Server } from "$server";
import account from "./handlers/account.tsx";
import credCreatOpt from "./handlers/auth/cred_creation_options.ts";
import credCreatVer from "./handlers/auth/cred_creation_verify.ts";
import credReqOpt from "./handlers/auth/cred_request_options.ts";
import credReqVer from "./handlers/auth/cred_request_verify.ts";
import logout from "./handlers/auth/logout.ts";
import passkeyDelete from "./handlers/auth/passkey_delete.ts";
import passkeyRename from "./handlers/auth/passkey_rename.ts";
import chatConnection from "./handlers/chat/chat_connection.ts";
import chatLazyLoad from "./handlers/chat/chat_lazy_load.tsx";
import toggleChatDisabled from "./handlers/chat/toggle_chat_disabled.ts";
import chatSubs from "./handlers/chat_subs.ts";
import home from "./handlers/home.tsx";
import notFound from "./handlers/not_found.tsx";
import checkSpaceName from "./handlers/spaces/check_name_available.ts";
import createSpace from "./handlers/spaces/create_space.ts";
import deleteSpace from "./handlers/spaces/delete_space.ts";
import showSpace from "./handlers/spaces/show_space.tsx";
import subscribers from "./handlers/subscribers.ts";
import vapid from "./handlers/vapid.ts";
import { headersMiddleware } from "./middleware/headers.ts";
import { errorMiddleware } from "./middleware/server_error.tsx";
import { sessionMiddleware } from "./middleware/session.ts";

const app = new Server();

app.use(errorMiddleware);
app.use(headersMiddleware);
app.use(sessionMiddleware);
app.use(flashMiddleware);

app.get("/", home);
app.post("/logout", logout);
app.get("/account", account);
app.post("/spaces", createSpace);
app.post("/spaces/delete", deleteSpace);
app.post("/spaces/check-name-available", checkSpaceName);
app.post("/subscribers", subscribers);
app.get("/vapid", vapid);
app.all("/chat-subs", chatSubs);
app.post("/chat/toggle-disabled", toggleChatDisabled);
app.get("/chat_lazy_load/:spaceId", chatLazyLoad);
app.get("/chat_connection/:spaceId", chatConnection);
app.get("/:spaceName", showSpace);
app.post("/auth/cred-creation-options", credCreatOpt);
app.post("/auth/cred-creation-verify", credCreatVer);
app.post("/auth/cred-request-options", credReqOpt);
app.post("/auth/cred-request-verify", credReqVer);
app.post("/auth/passkey-delete", passkeyDelete);
app.post("/auth/passkey-rename", passkeyRename);
app.all("*", notFound);

let serverOpt;

if (IS_LOCAL_DEV) {
  serverOpt = {
    cert: await Deno.readTextFile("util/cert/hotspace.local.crt"),
    key: await Deno.readTextFile("util/cert/hotspace.local.key"),
    port: 443,
  };
}

app.serve(serverOpt);
