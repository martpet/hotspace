import { flashMiddleware, Server, staticFilesHandler } from "$server";
import { uploadWorkerHandler } from "$upload";
import account from "./handlers/account/account.tsx";
import deleteAccount from "./handlers/account/delete.tsx";
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
import setDirByPath from "./handlers/inodes/create_dir.ts";
import deleteInodes from "./handlers/inodes/delete.ts";
import showDir from "./handlers/inodes/show_dir.tsx";
import showFile from "./handlers/inodes/show_file.tsx";
import completeUpload from "./handlers/inodes/upload/complete.tsx";
import initiateUpload from "./handlers/inodes/upload/initiate.tsx";
import manifestJson from "./handlers/manifest_json.ts";
import subscribers from "./handlers/push_sub/subscribers.ts";
import vapid from "./handlers/push_sub/vapid.ts";
import { queueHandler } from "./handlers/queue/main_handler.ts";
import awsMediaConvertWebHook from "./handlers/webhooks/aws_media_convert_event.ts.ts";
import { csrfMiddleware } from "./middleware/csrf.tsx";
import { headersMiddleware } from "./middleware/headers.ts";
import { errorMiddleware } from "./middleware/server_error.tsx";
import { sessionMiddleware } from "./middleware/session.ts";
import { stateMiddleware } from "./middleware/state.ts";
import { IS_LOCAL_DEV } from "./util/consts.ts";
import { kv } from "./util/kv/kv.ts";

const app = new Server({ trailingSlash: "mixed" });

app.use(csrfMiddleware);
app.use(errorMiddleware);
app.use(headersMiddleware);
app.use(sessionMiddleware);
app.use(stateMiddleware);
app.use(flashMiddleware);

app.get("/", home);
app.get("/register", register);
app.post("/logout", logout);
app.get("/account", account);
app.post("/account/delete", deleteAccount);
app.post("/account/passkeys/delete", passkeyDelete);
app.post("/account/passkeys/rename", passkeyRename);

const s = app.route("/static");
s.get("/manifest.json", manifestJson);
s.get("/upload_worker.js", uploadWorkerHandler);
s.get("/*", staticFilesHandler);

const a = app.route("/app");
a.post("/auth/cred-creation-options", credCreatOpt);
a.post("/auth/cred-creation-verify", credCreatVer);
a.post("/auth/cred-request-options", credReqOpt);
a.post("/auth/cred-request-verify", credReqVer);
a.post("/inodes/dirs", setDirByPath);
a.post("/inodes/delete", deleteInodes);
a.post("/inodes/upload/initiate", initiateUpload);
a.post("/inodes/upload/complete", completeUpload);
a.get("/chat/lazy-load/:chatId", chatLazyLoad);
a.get("/chat/connection/:chatId", chatConnection);
a.post("/chat/toggle", toggleChat);
a.all("/chat/subs", chatSubs);
a.post("/push-subs/subscribers", subscribers);
a.get("/push-subs/vapid", vapid);
a.post("/webhooks/aws-media-convert", awsMediaConvertWebHook);

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

kv.listenQueue(queueHandler);
