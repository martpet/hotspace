import { STATUS_CODE } from "@std/http";
import { GENERAL_ERR_MSG } from "../../util/consts.ts";
import { kv } from "../../util/kv/kv.ts";
import { deletePasskey, getPasskeyById } from "../../util/kv/passkeys.ts";
import {
  deleteSession,
  listSessionsByPasskey,
} from "../../util/kv/sessions.ts";
import type { AppContext } from "../../util/types.ts";

export default async function passkeyDeleteHandler(ctx: AppContext) {
  const user = ctx.state.user;

  if (!user) {
    return ctx.respond(null, STATUS_CODE.Unauthorized);
  }

  const form = await ctx.req.formData();
  const credId = form.get("credId") as string;
  const passkeyEntry = await getPasskeyById(credId);
  const passkey = passkeyEntry.value;

  if (!passkey || user.id !== passkey.userId) {
    ctx.setFlash({ type: "error", msg: "The passkey doesn't exist!" });
    return ctx.redirectBack();
  }

  const sessionsByPasskey = await listSessionsByPasskey(credId);

  const atomic = kv.atomic();
  deletePasskey(passkey, atomic);

  sessionsByPasskey.forEach((sess) => {
    if (sess.credId !== ctx.state.session!.credId) {
      deleteSession(sess, atomic);
    }
  });

  const { ok } = await atomic.commit();

  if (!ok) {
    ctx.setFlash({ type: "error", msg: GENERAL_ERR_MSG });
    return ctx.redirectBack();
  }

  ctx.setFlash("Successfully deleted passkey!");

  return ctx.redirectBack();
}
