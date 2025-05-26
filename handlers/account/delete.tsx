import { SESSION_COOKIE } from "$webauthn";
import { deleteCookie, STATUS_CODE } from "@std/http";
import { enqueue } from "../../util/kv/enqueue.ts";
import { kv } from "../../util/kv/kv.ts";
import { deleteUser } from "../../util/kv/users.ts";
import { type QueueMsgCleanUpUser } from "../../util/queue/clean_up_user.ts";
import type { AppContext } from "../../util/types.ts";

export default async function deleteAccountHandler(ctx: AppContext) {
  const { user } = ctx.state;

  if (!user) {
    return ctx.respond(null, STATUS_CODE.Unauthorized);
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
