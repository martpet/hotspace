import { STATUS_CODE } from "@std/http";
import { getPasskeyById, setPasskey } from "../../util/db/passkeys.ts";
import type { AppContext } from "../../util/types.ts";

export default async function passkeyRename(ctx: AppContext) {
  const user = ctx.state.user;

  if (!user) {
    return ctx.respond(null, STATUS_CODE.Unauthorized);
  }

  const { credId, newName } = await ctx.req.json();
  const passkey = (await getPasskeyById(credId)).value;

  if (user.id !== passkey?.userId) {
    return ctx.respond(null, STATUS_CODE.Forbidden);
  }

  passkey.name = newName;

  const commit = await setPasskey(passkey).commit();

  if (!commit.ok) {
    ctx.res.status = STATUS_CODE.InternalServerError;
  }

  return ctx.respond();
}
