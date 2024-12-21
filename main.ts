import {
  flashMiddleware,
  IS_LOCAL_DEV,
  Server,
  type ServerOptions,
} from "$server";
import account from "./handlers/account/account.tsx";
import logout from "./handlers/account/logout.ts";
import register from "./handlers/account/register.tsx";
import credCreatOpt from "./handlers/auth/cred_creation_options.ts";
import credCreatVer from "./handlers/auth/cred_creation_verify.ts";
import credReqOpt from "./handlers/auth/cred_request_options.ts";
import credReqVer from "./handlers/auth/cred_request_verify.ts";
import passkeyDelete from "./handlers/auth/passkey_delete.ts";
import passkeyRename from "./handlers/auth/passkey_rename.ts";
import chatConnection from "./handlers/chat/connection.ts";
import chatLazyLoad from "./handlers/chat/lazy_load.tsx";
import chatSubs from "./handlers/chat/subs.ts";
import home from "./handlers/home.tsx";
import createDir from "./handlers/inodes/create_dir.ts";
import showInode from "./handlers/inodes/show.tsx";
import toggleChat from "./handlers/inodes/toggle_chat.ts";
import subscribers from "./handlers/push_sub/subscribers.ts";
import vapid from "./handlers/push_sub/vapid.ts";
import { headersMiddleware } from "./middleware/headers.ts";
import { errorMiddleware } from "./middleware/server_error.tsx";
import { sessionMiddleware } from "./middleware/session.ts";
import { stateMiddleware } from "./middleware/state.ts";

const options: ServerOptions = {
  trailingSlashMode: "mixed",
};

if (IS_LOCAL_DEV) {
  options.serveOptions = {
    cert: await Deno.readTextFile("util/cert/hotspace.local.crt"),
    key: await Deno.readTextFile("util/cert/hotspace.local.key"),
    port: 443,
  };
}

const app = new Server(options);

app.use(errorMiddleware);
app.use(headersMiddleware);
app.use(sessionMiddleware);
app.use(stateMiddleware);
app.use(flashMiddleware);

app.get("/", home);
app.get("/register", register);
app.post("/logout", logout);
app.post("/auth/cred-creation-options", credCreatOpt);
app.post("/auth/cred-creation-verify", credCreatVer);
app.post("/auth/cred-request-options", credReqOpt);
app.post("/auth/cred-request-verify", credReqVer);
app.get("/account", account);
app.post("/account/passkeys/delete", passkeyDelete);
app.post("/account/passkeys/rename", passkeyRename);
app.post("/push-subs/subscribers", subscribers);
app.get("/push-subs/vapid", vapid);
app.get("/chat/lazy-load/:chatId", chatLazyLoad);
app.get("/chat/connection/:chatId", chatConnection);
app.all("/chat/subs", chatSubs);
app.post("/inodes/dirs", createDir);
app.post("/inodes/toggle_chat", toggleChat);
app.get("*", showInode);

app.serve();
