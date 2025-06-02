import { flashMiddleware, Server, staticFilesHandler } from "$server";
import { uploadWorkerHandler } from "$upload";
import about from "./handlers/about.tsx";
import account from "./handlers/account/account.tsx";
import deleteAccount from "./handlers/account/delete.ts";
import logout from "./handlers/account/logout.ts";
import register from "./handlers/account/register.tsx";
import adminSettings from "./handlers/admin/settings.tsx";
import listUsers from "./handlers/admin/users/list_users.tsx";
import userHandler from "./handlers/admin/users/user.tsx";
import credCreatOpt from "./handlers/auth/credential_creation_options.ts";
import credCreatVer from "./handlers/auth/credential_creation_verify.ts";
import credReqOpt from "./handlers/auth/credential_request_options.ts";
import credReqVer from "./handlers/auth/credential_request_verify.ts";
import passkeyDelete from "./handlers/auth/passkey_delete.ts";
import passkeyRename from "./handlers/auth/passkey_rename.ts";
import chatConnection from "./handlers/chat/connection.ts";
import chatLazyLoad from "./handlers/chat/lazy_load.tsx";
import chatSubs from "./handlers/chat/subs.ts";
import toggleChat from "./handlers/chat/toggle_chat.ts";
import contact from "./handlers/contact.tsx";
import home from "./handlers/home.tsx";
import changeAcl from "./handlers/inodes/acl/change_acl.ts";
import getAclPreview from "./handlers/inodes/acl/get_acl_preview.ts";
import setDirByPath from "./handlers/inodes/create_dir.ts";
import deleteInodes from "./handlers/inodes/delete.ts";
import getFile from "./handlers/inodes/get_file.ts";
import listenPostProcessing from "./handlers/inodes/listen_post_processing.ts";
import showDirHandler from "./handlers/inodes/show_dir.tsx";
import showFileHandler from "./handlers/inodes/show_file.tsx";
import completeUpload from "./handlers/inodes/upload/complete.tsx";
import initiateUpload from "./handlers/inodes/upload/initiate.tsx";
import videoPlaylist from "./handlers/inodes/video_playlist.ts";
import manifestJson from "./handlers/manifest_json.ts";
import createPaymentIntent from "./handlers/payment/create_intent.ts";
import listenPaymentCreated from "./handlers/payment/listen_payment_created.ts";
import privacy from "./handlers/privacy.tsx";
import subscribers from "./handlers/push_sub/subscribers.ts";
import vapid from "./handlers/push_sub/vapid.ts";
import terms from "./handlers/terms.tsx";
import awsWebhook from "./handlers/webhooks/aws.ts";
import { csrfMiddleware } from "./middleware/csrf.tsx";
import { headersMiddleware } from "./middleware/headers.ts";
import { errorMiddleware } from "./middleware/server_error.tsx";
import { sessionMiddleware } from "./middleware/session.ts";
import { stateMiddleware } from "./middleware/state.ts";
import { IS_LOCAL_DEV } from "./util/consts.ts";
import fetchPasskeysAaguid from "./util/cron/fetchPasskeysAaguid.ts";
import { kv } from "./util/kv/kv.ts";
import { queueHandler } from "./util/queue/queue_handler.ts";

kv.listenQueue(queueHandler);

const app = new Server({ trailingSlash: "mixed" });

app.use(csrfMiddleware);
app.use(errorMiddleware);
app.use(headersMiddleware);
app.use(sessionMiddleware);
app.use(stateMiddleware);
app.use(flashMiddleware);

app.post("/webhooks/aws", awsWebhook);

app.get("/", home);
app.get("/terms", terms);
app.get("/privacy", privacy);
app.get("/contact", contact);
app.get("/about", about);
app.get("/register", register);
app.post("/logout", logout);
app.get("/account", account);
app.delete("/account", deleteAccount);

app.on(["GET", "POST"], "/admin/settings", adminSettings);
app.get("/admin/users", listUsers);
app.on(["GET", "POST"], "/admin/users/:userId", userHandler);

app.post("/payment/intent", createPaymentIntent);
app.get("/payment/listen-created/:paymentIntentId", listenPaymentCreated);

app.get("/assets/manifest.json", manifestJson);
app.get("/assets/upload_worker.js", uploadWorkerHandler);
app.get("/assets/*", staticFilesHandler);

app.post("/auth/credential-creation-options", credCreatOpt);
app.post("/auth/credential-creation-verify", credCreatVer);
app.post("/auth/credential-request-options", credReqOpt);
app.post("/auth/credential-request-verify", credReqVer);
app.post("/auth/passkey-delete", passkeyDelete);
app.post("/auth/passkey-rename", passkeyRename);

app.post("/inodes/dirs", setDirByPath);
app.post("/inodes/delete", deleteInodes);
app.post("/inodes/upload/initiate", initiateUpload);
app.post("/inodes/upload/complete", completeUpload);
app.get("/inodes/file/:inodeId", getFile);
app.get("/inodes/video-playlist/:inodeId/:renditionIndex", videoPlaylist);
app.post("/inodes/acl", changeAcl);
app.get("/inodes/acl-preview/:inodeId", getAclPreview);
app.get("/inodes/listen-post-processing/:inodeId", listenPostProcessing);

app.get("/chat/lazy-load/:chatId", chatLazyLoad);
app.get("/chat/connection/:chatId", chatConnection);
app.post("/chat/toggle", toggleChat);
app.all("/chat/subs", chatSubs);

app.post("/push-subs/subscribers", subscribers);
app.get("/push-subs/vapid", vapid);

app.get("*/", showDirHandler);
app.get("*", showFileHandler);

let serveOptions;

if (IS_LOCAL_DEV) {
  serveOptions = {
    cert: await Deno.readTextFile("util/cert/localhost+2.pem"),
    key: await Deno.readTextFile("util/cert/localhost+2-key.pem"),
    port: 8443,
  };
}

app.serve(serveOptions);

// =====================
// Cron
// =====================

Deno.cron("Fetch passkeys AAGUID", "0 2 * * 1", fetchPasskeysAaguid);
