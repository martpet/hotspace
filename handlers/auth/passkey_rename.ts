import { STATUS_CODE } from "@std/http";
import { getPasskeyById, setPasskey } from "../../util/kv/passkeys.ts";
import type { AppContext } from "../../util/types.ts";

export default async function passkeyRenameHandler(ctx: AppContext) {
  const user = ctx.state.user;

  if (!user) {
    return ctx.respond(null, STATUS_CODE.Unauthorized);
  }

  const { credId, newName } = await ctx.req.json();
  const passkey = (await getPasskeyById(credId)).value;

  if (!passkey) {
    return ctx.respond(null, STATUS_CODE.NotFound);
  }

  if (user.id !== passkey.userId) {
    return ctx.respond(null, STATUS_CODE.Forbidden);
  }

  passkey.name = newName;

  const { ok } = await setPasskey(passkey).commit();

  if (!ok) {
    ctx.resp.status = STATUS_CODE.Conflict;
  }

  return ctx.respond();
}
