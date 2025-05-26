import { SESSION_COOKIE } from "$webauthn";
import { MINUTE } from "@std/datetime";
import { deleteCookie, STATUS_CODE } from "@std/http";
import { enqueue } from "../../util/kv/enqueue.ts";
import { kv } from "../../util/kv/kv.ts";
import { deleteUser } from "../../util/kv/users.ts";
import { type QueueMsgCleanUpUser } from "../../util/queue/clean_up_user.ts";
import { isSessionFresh } from "../../util/session.ts";
import type { AppContext } from "../../util/types.ts";

export default async function deleteAccountHandler(ctx: AppContext) {
  const { user, session } = ctx.state;

  if (!user || !session) {
    return ctx.respond(null, STATUS_CODE.Unauthorized);
  }

  if (!isSessionFresh(session, MINUTE)) {
    return ctx.respondJson({ error: "auth_again" }, STATUS_CODE.Forbidden);
  }

  const cleanupMsg: QueueMsgCleanUpUser = {
    type: "clean-up-user",
    userId: user.id,
    username: user.username,
  };

  const atomic = kv.atomic();
  deleteUser(user, atomic);
  enqueue(cleanupMsg, atomic);

  const commit = await atomic.commit();

  if (!commit.ok) {
    return ctx.respond(null, STATUS_CODE.Conflict);
  }

  deleteCookie(ctx.resp.headers, SESSION_COOKIE, { path: "/" });

  return ctx.respond();
}
