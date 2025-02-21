import { flashMiddleware, Server, staticFilesHandler } from "$server";
import { uploadWorkerHandler } from "$upload";
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
import toggleChat from "./handlers/chat/toggle_chat.ts";
import home from "./handlers/home.tsx";
import setDirNode from "./handlers/inodes/create_dir.ts";
import deleteInodes from "./handlers/inodes/delete.ts";
import showDir from "./handlers/inodes/show_dir.tsx";
import showFile from "./handlers/inodes/show_file.tsx";
import completeUpload from "./handlers/inodes/upload/complete.tsx";
import initiateUpload from "./handlers/inodes/upload/initiate.tsx";
import manifestJson from "./handlers/manifest_json.ts";
import subscribers from "./handlers/push_sub/subscribers.ts";
import vapid from "./handlers/push_sub/vapid.ts";
import { headersMiddleware } from "./middleware/headers.ts";
import { errorMiddleware } from "./middleware/server_error.tsx";
import { sessionMiddleware } from "./middleware/session.ts";
import { stateMiddleware } from "./middleware/state.ts";
import { IS_LOCAL_DEV } from "./util/consts.ts";
import { kv } from "./util/kv/kv.ts";
import { queueHandler } from "./util/kv/queue_handlers/main_handler.ts";

kv.listenQueue(queueHandler);

const app = new Server({ trailingSlash: "mixed" });

app.use(errorMiddleware);
app.use(headersMiddleware);
app.use(sessionMiddleware);
app.use(stateMiddleware);
app.use(flashMiddleware);

app.get("/", home);
app.get("/static/manifest.json", manifestJson);
app.get("/static/upload_worker.js", uploadWorkerHandler);
app.get("/static/*", staticFilesHandler);
app.get("/register", register);
app.get("/account", account);
app.post("/logout", logout);
app.post("/auth/cred-creation-options", credCreatOpt);
app.post("/auth/cred-creation-verify", credCreatVer);
app.post("/auth/cred-request-options", credReqOpt);
app.post("/auth/cred-request-verify", credReqVer);
app.post("/account/passkeys/delete", passkeyDelete);
app.post("/account/passkeys/rename", passkeyRename);
app.post("/inodes/dirs", setDirNode);
app.post("/inodes/delete", deleteInodes);
app.post("/inodes/upload/initiate", initiateUpload);
app.post("/inodes/upload/complete", completeUpload);
app.get("/chat/lazy-load/:chatId", chatLazyLoad);
app.get("/chat/connection/:chatId/(:parentDirId)?", chatConnection);
app.post("/chat/toggle", toggleChat);
app.all("/chat/subs", chatSubs);
app.post("/push-subs/subscribers", subscribers);
app.get("/push-subs/vapid", vapid);
app.get("*/", showDir);
app.get("*", showFile);

let serveOptions;

if (IS_LOCAL_DEV) {
  serveOptions = {
    cert: await Deno.readTextFile("util/cert/hotspace.local.crt"),
    key: await Deno.readTextFile("util/cert/hotspace.local.key"),
    port: 443,
  };
}

app.serve(serveOptions);
