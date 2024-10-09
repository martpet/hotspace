import { STATUS_CODE } from "@std/http";
import { GENERAL_ERROR_MSG } from "../../util/consts.ts";
import { getSpaceByName, setSpace } from "../../util/db/spaces.ts";
import type { AppContext } from "../../util/types.ts";

export default async function setChatEnabled(ctx: AppContext) {
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

  const enable = !space.chatEnabled;
  space.chatEnabled = enable;

  const commit = await setSpace(space)
    .check(spaceEntry)
    .commit();

  if (!commit.ok) {
    ctx.setFlash({ type: "error", msg: GENERAL_ERROR_MSG });
  } else {
    ctx.setFlash(`Chat ${enable ? "Enabled" : "Disabled"}`);
  }

  return ctx.redirectBack();
}
