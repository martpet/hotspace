import Server, { flashMiddleware } from "$server";
import account from "./handlers/account.tsx";
import credCreatOpt from "./handlers/auth/cred_creation_options.ts";
import credCreatVer from "./handlers/auth/cred_creation_verify.ts";
import credReqOpt from "./handlers/auth/cred_request_options.ts";
import credReqVer from "./handlers/auth/cred_request_verify.ts";
import logout from "./handlers/auth/logout.ts";
import passkeyDelete from "./handlers/auth/passkey_delete.ts";
import passkeyRename from "./handlers/auth/passkey_rename.ts";
import chat from "./handlers/chat/chat.ts";
import setChatEnabled from "./handlers/chat/toggle_chat_enabled.ts";
import home from "./handlers/home.tsx";
import notFound from "./handlers/not_found.tsx";
import checkSpaceName from "./handlers/spaces/check_name_available.ts";
import createSpace from "./handlers/spaces/create_space.ts";
import deleteSpace from "./handlers/spaces/delete_space.ts";
import showSpace from "./handlers/spaces/show_space.tsx";
import { errorMiddleware } from "./middleware/server_error.tsx";
import { sessionMiddleware } from "./middleware/session.ts";

const app = new Server();

app.get("/", home);
app.post("/logout", logout);
app.post("/spaces", createSpace);
app.post("/spaces/delete", deleteSpace);
app.post("/spaces/check-name-available", checkSpaceName);
app.post("/chat/toggle-enabled", setChatEnabled);
app.get("/chat/:spaceId/:spaceItemId?", chat);
app.get("/account", account);
app.get("/:spaceName", showSpace);
app.post("/auth/cred-creation-options", credCreatOpt);
app.post("/auth/cred-creation-verify", credCreatVer);
app.post("/auth/cred-request-options", credReqOpt);
app.post("/auth/cred-request-verify", credReqVer);
app.post("/auth/passkey-delete", passkeyDelete);
app.post("/auth/passkey-rename", passkeyRename);
app.all("*", notFound);

app.use(errorMiddleware);
app.use(sessionMiddleware);
app.use(flashMiddleware);

app.serve();
