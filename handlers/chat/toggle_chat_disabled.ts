import { STATUS_CODE } from "@std/http";
import { GENERAL_ERR_MSG } from "../../util/consts.ts";
import { getSpaceByName, setSpace } from "../../util/kv/spaces.ts";
import type { AppContext } from "../../util/types.ts";

export default async function toggleChatDisabledHandler(ctx: AppContext) {
  const user = ctx.state.user;

  if (!user) {
    return ctx.respond(null, STATUS_CODE.Unauthorized);
  }

  const formData = await ctx.req.formData();
  const spaceName = formData.get("spaceName") as string | null;

  if (!spaceName) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  const spaceEntry = await getSpaceByName(spaceName);
  const space = spaceEntry.value;

  if (!space) {
    ctx.setFlash({ type: "error", msg: `Space "${spaceName}" doesn't exist!` });
    return ctx.redirect("/");
  }

  if (space.ownerUsername !== user.username) {
    ctx.setFlash({ type: "error", msg: `You don't own space "${spaceName}"!` });
    return ctx.redirectBack();
  }

  const disabled = !space.chatDisabled;
  space.chatDisabled = disabled;

  const { ok } = await setSpace(space)
    .check(spaceEntry)
    .commit();

  if (ok) {
    ctx.setFlash(`Chat ${disabled ? "disabled" : "enabled"}`);
  } else {
    ctx.setFlash({ type: "error", msg: GENERAL_ERR_MSG });
  }

  return ctx.redirectBack();
}
