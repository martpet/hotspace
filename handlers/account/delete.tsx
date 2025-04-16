import { SESSION_COOKIE } from "$webauthn";
import { deleteCookie } from "@std/http";
import { GENERAL_ERR_MSG } from "../../util/consts.ts";
import { enqueue } from "../../util/kv/enqueue.ts";
import { kv } from "../../util/kv/kv.ts";
import { deleteUser } from "../../util/kv/users.ts";
import type { AppContext } from "../../util/types.ts";
import { type QueueMsgCleanUpUser } from "../../util/queue/clean_up_user.ts";

export default async function deleteAccountHandler(ctx: AppContext) {
  const { user } = ctx.state;

  if (!user) {
    return ctx.redirectBack();
  }

  const atomic = kv.atomic();

  deleteUser(user, atomic);

  enqueue<QueueMsgCleanUpUser>({
    type: "clean-up-user",
    userId: user.id,
    username: user.username,
  }, atomic);

  const commit = await atomic.commit();

  if (!commit.ok) {
    ctx.setFlash({ type: "error", msg: GENERAL_ERR_MSG });
    return ctx.redirectBack();
  }

  deleteCookie(ctx.resp.headers, SESSION_COOKIE, { path: "/" });

  ctx.setFlash(
    "Your account has been deleted. You can remove your passkey from your device.",
  );

  return ctx.redirect("/");
}
